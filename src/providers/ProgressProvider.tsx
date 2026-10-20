import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ProgressState } from '../types';
import {
  completedThisWeek,
  dayKey,
  loadProgress,
  persistProgress,
  streakLength,
  withCompletion,
  withToday,
} from '../lib/progress';

interface ProgressContextValue {
  completed: Record<string, string>;
  completedCount: number;
  weekCount: number;
  streak: number;
  isComplete: (topicId: string) => boolean;
  completedAt: (topicId: string) => string | undefined;
  markComplete: (topicId: string) => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(loadProgress);

  // Visiting the library counts as a day of practice. Writing on mount keeps
  // the ledger current without a timer or a background process.
  useEffect(() => {
    setState((current) => {
      const next = withToday(current);
      if (next === current) return current;
      persistProgress(next);
      return next;
    });
  }, []);

  const markComplete = useCallback((topicId: string) => {
    setState((current) => {
      const next = withCompletion(current, topicId);
      persistProgress(next);
      return next;
    });
  }, []);

  const isComplete = useCallback(
    (topicId: string) => Boolean(state.completed[topicId]),
    [state.completed],
  );

  const completedAt = useCallback(
    (topicId: string) => state.completed[topicId],
    [state.completed],
  );

  const value = useMemo<ProgressContextValue>(
    () => ({
      completed: state.completed,
      completedCount: Object.keys(state.completed).length,
      weekCount: completedThisWeek(state.completed),
      streak: streakLength(state.activity, new Date()),
      isComplete,
      completedAt,
      markComplete,
    }),
    [state, isComplete, completedAt, markComplete],
  );

  // Keep the value's streak in sync with a day rollover while the tab stays open.
  useEffect(() => {
    if (state.activity[0] === dayKey()) return;
    const timeout = window.setTimeout(() => {
      setState((current) => {
        const next = withToday(current);
        if (next === current) return current;
        persistProgress(next);
        return next;
      });
    }, 60_000);
    return () => window.clearTimeout(timeout);
  }, [state.activity]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const context = useContext(ProgressContext);
  if (!context) throw new Error('useProgress must be used within ProgressProvider');
  return context;
}
