const memoryStore = new Map<string, string>();

export const storageAvailable: boolean = (() => {
  if (typeof window === 'undefined') return false;
  try {
    const key = '__rt_probe__';
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
})();

function readRaw(key: string): string | null {
  if (storageAvailable && typeof window !== 'undefined') {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memoryStore.get(key) ?? null;
    }
  }
  return memoryStore.get(key) ?? null;
}

function writeRaw(key: string, value: string): boolean {
  memoryStore.set(key, value);
  if (!storageAvailable || typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function readJSON<T>(key: string, fallback: T, validate?: (value: unknown) => value is T): T {
  const raw = readRaw(key);
  if (!raw) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (validate && !validate(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): boolean {
  try {
    return writeRaw(key, JSON.stringify(value));
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  memoryStore.delete(key);
  if (!storageAvailable || typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage can be unavailable or read-only; the in-memory copy remains authoritative.
  }
}

export const storageKeys = {
  theme: 'rt.theme.v1',
  saved: 'rt.saved.v1',
  notes: 'rt.notes.v1',
  history: 'rt.history.v1',
  drawCollection: 'rt.draw.collection.v1',
  drawDifficulty: 'rt.draw.difficulty.v1',
  checklist: (topicId: string) => `rt.ritual.${topicId}.v1`,
} as const;
