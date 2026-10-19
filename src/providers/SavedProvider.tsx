import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { readJSON, storageKeys, writeJSON } from '../lib/storage';
import { topicById } from '../lib/library';
import type { SavedNote, Topic } from '../types';
import { useToast } from './ToastProvider';

interface SavedContextValue {
  savedIds: string[];
  savedTopics: Topic[];
  isSaved: (topicId: string) => boolean;
  toggleSaved: (topicId: string) => boolean;
  removeSaved: (topicId: string) => void;
  notes: Record<string, SavedNote>;
  saveNote: (topicId: string, text: string) => void;
  getNote: (topicId: string) => SavedNote | undefined;
}

const SavedContext = createContext<SavedContextValue | null>(null);

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isNotesRecord(value: unknown): value is Record<string, SavedNote> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.values(value).every(
    (entry) =>
      Boolean(entry) &&
      typeof entry === 'object' &&
      typeof (entry as SavedNote).text === 'string' &&
      typeof (entry as SavedNote).updatedAt === 'string',
  );
}

export function SavedProvider({ children }: { children: ReactNode }) {
  const { notify } = useToast();
  const [savedIds, setSavedIds] = useState<string[]>(() =>
    readJSON<string[]>(storageKeys.saved, [], isStringArray).filter((id) => topicById.has(id)),
  );
  const [notes, setNotes] = useState<Record<string, SavedNote>>(() =>
    readJSON<Record<string, SavedNote>>(storageKeys.notes, {}, isNotesRecord),
  );
  const warned = useRef(false);

  const warnIfNeeded = useCallback(
    (persisted: boolean) => {
      if (!persisted && !warned.current) {
        warned.current = true;
        notify('Browser storage is unavailable. Changes will last for this session only.', 'error');
      }
    },
    [notify],
  );

  const persistIds = useCallback(
    (next: string[]) => {
      setSavedIds(next);
      warnIfNeeded(writeJSON(storageKeys.saved, next));
    },
    [warnIfNeeded],
  );

  const persistNotes = useCallback(
    (next: Record<string, SavedNote>) => {
      setNotes(next);
      warnIfNeeded(writeJSON(storageKeys.notes, next));
    },
    [warnIfNeeded],
  );

  useEffect(() => {
    // Prune notes that no longer have a topic in the current dataset.
    const orphaned = Object.keys(notes).filter((id) => !topicById.has(id));
    if (orphaned.length) {
      const next = { ...notes };
      for (const id of orphaned) delete next[id];
      persistNotes(next);
    }
  }, [notes, persistNotes]);

  const isSaved = useCallback((topicId: string) => savedIds.includes(topicId), [savedIds]);

  const toggleSaved = useCallback(
    (topicId: string): boolean => {
      const exists = savedIds.includes(topicId);
      persistIds(exists ? savedIds.filter((id) => id !== topicId) : [topicId, ...savedIds]);
      if (exists) {
        const nextNotes = { ...notes };
        delete nextNotes[topicId];
        persistNotes(nextNotes);
      }
      return !exists;
    },
    [savedIds, notes, persistIds, persistNotes],
  );

  const removeSaved = useCallback(
    (topicId: string) => {
      persistIds(savedIds.filter((id) => id !== topicId));
      const nextNotes = { ...notes };
      delete nextNotes[topicId];
      persistNotes(nextNotes);
    },
    [savedIds, notes, persistIds, persistNotes],
  );

  const saveNote = useCallback(
    (topicId: string, text: string) => {
      const next = {
        ...notes,
        [topicId]: { text, updatedAt: new Date().toISOString() },
      };
      persistNotes(next);
    },
    [notes, persistNotes],
  );

  const getNote = useCallback((topicId: string) => notes[topicId], [notes]);

  const savedTopics = useMemo(
    () => savedIds.map((id) => topicById.get(id)).filter((topic): topic is Topic => Boolean(topic)),
    [savedIds],
  );

  const value = useMemo<SavedContextValue>(
    () => ({
      savedIds,
      savedTopics,
      isSaved,
      toggleSaved,
      removeSaved,
      notes,
      saveNote,
      getNote,
    }),
    [savedIds, savedTopics, isSaved, toggleSaved, removeSaved, notes, saveNote, getNote],
  );

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved(): SavedContextValue {
  const context = useContext(SavedContext);
  if (!context) throw new Error('useSaved must be used within SavedProvider');
  return context;
}
