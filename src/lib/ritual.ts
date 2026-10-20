import type { RitualDraft, RitualSource } from '../types';
import { readJSON, storageKeys, writeJSON } from './storage';

export const TOTAL_SECONDS = 15 * 60;

export const RESEARCH_MOVES = [
  'Define the concept in your own words.',
  'Understand how it actually works.',
  'Identify one practical application.',
  'Discover one limitation or trade-off.',
  'Explain what you learned without your notes.',
];

function isCheckArray(value: unknown): value is boolean[] {
  return (
    Array.isArray(value) &&
    value.length === RESEARCH_MOVES.length &&
    value.every((entry) => typeof entry === 'boolean')
  );
}

function isSource(value: unknown): value is RitualSource {
  if (!value || typeof value !== 'object') return false;
  const source = value as Record<string, unknown>;
  return typeof source.id === 'string' && typeof source.label === 'string';
}

function isDraft(value: unknown): value is RitualDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Record<string, unknown>;
  return (
    isCheckArray(draft.checked) &&
    Array.isArray(draft.sources) &&
    draft.sources.every(isSource) &&
    typeof draft.answer === 'string' &&
    typeof draft.learned === 'string' &&
    typeof draft.remaining === 'number' &&
    typeof draft.started === 'boolean'
  );
}

export function createDraft(): RitualDraft {
  return {
    checked: RESEARCH_MOVES.map(() => false),
    sources: [],
    answer: '',
    learned: '',
    remaining: TOTAL_SECONDS,
    started: false,
    endAt: null,
    spentSeconds: 0,
    completedAt: null,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Restores a session, including a timer that kept running while the tab was
 * closed. Legacy checklist-only sessions are migrated in place.
 */
export function loadDraft(topicId: string): RitualDraft {
  const stored = readJSON<RitualDraft | null>(storageKeys.session(topicId), null, isDraft);
  if (stored) {
    const draft: RitualDraft = {
      ...createDraft(),
      ...stored,
      endAt: typeof stored.endAt === 'number' ? stored.endAt : null,
      spentSeconds: typeof stored.spentSeconds === 'number' ? stored.spentSeconds : 0,
      completedAt: typeof stored.completedAt === 'string' ? stored.completedAt : null,
    };
    if (draft.endAt) {
      const left = Math.ceil((draft.endAt - Date.now()) / 1000);
      draft.remaining = Math.max(0, left);
      if (left <= 0) draft.endAt = null;
    }
    return draft;
  }

  const legacy = readJSON<boolean[]>(
    storageKeys.checklist(topicId),
    RESEARCH_MOVES.map(() => false),
    isCheckArray,
  );
  return { ...createDraft(), checked: legacy };
}

export function saveDraft(topicId: string, draft: RitualDraft): boolean {
  return writeJSON(storageKeys.session(topicId), {
    ...draft,
    updatedAt: new Date().toISOString(),
  });
}

export interface ParsedSource {
  label: string;
  url?: string;
}

/**
 * Accepts a full URL, a bare domain, or a plain-text reference (a book, a
 * lecture, a person to ask). Plain text stays plain text.
 */
export function parseSource(value: string): ParsedSource {
  const trimmed = value.trim();
  if (!trimmed) return { label: '' };
  const looksLikeUrl = /^https?:\/\//i.test(trimmed);
  const looksLikeDomain = /^[\w-]+(\.[\w-]+)+([/?#].*)?$/.test(trimmed);
  if (!looksLikeUrl && !looksLikeDomain) return { label: trimmed };

  const url = looksLikeUrl ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    const path = parsed.pathname === '/' ? '' : parsed.pathname;
    return { label: `${host}${path}`.slice(0, 90), url: parsed.toString() };
  } catch {
    return { label: trimmed };
  }
}

export function sourceKey(source: ParsedSource): string {
  return (source.url ?? source.label).toLowerCase();
}

export function makeSourceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `src-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const rest = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

export function spokenTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const minutesLabel = `${minutes} minute${minutes === 1 ? '' : 's'}`;
  if (seconds === 0) return minutesLabel;
  return `${minutesLabel} ${seconds} second${seconds === 1 ? '' : 's'}`;
}
