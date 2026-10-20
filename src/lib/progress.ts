import type { ProgressState } from '../types';
import { readJSON, storageKeys, writeJSON } from './storage';

const EMPTY: ProgressState = { completed: {}, activity: [] };

export function dayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isProgress(value: unknown): value is ProgressState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Record<string, unknown>;
  if (!Array.isArray(state.activity) || !state.activity.every((day) => typeof day === 'string')) {
    return false;
  }
  if (!state.completed || typeof state.completed !== 'object' || Array.isArray(state.completed)) {
    return false;
  }
  return Object.values(state.completed).every((entry) => typeof entry === 'string');
}

export function loadProgress(): ProgressState {
  return readJSON<ProgressState>(storageKeys.progress, EMPTY, isProgress);
}

export function persistProgress(state: ProgressState): boolean {
  return writeJSON(storageKeys.progress, state);
}

/** Adds today to the activity ledger, most recent first, capped to a year. */
export function withToday(state: ProgressState, today = dayKey()): ProgressState {
  if (state.activity[0] === today) return state;
  return {
    ...state,
    activity: [today, ...state.activity.filter((day) => day !== today)].slice(0, 400),
  };
}

export function withCompletion(
  state: ProgressState,
  topicId: string,
  timestamp = new Date().toISOString(),
): ProgressState {
  const active = withToday(state);
  return {
    ...active,
    completed: { ...active.completed, [topicId]: timestamp },
  };
}

/**
 * Counts consecutive days of use. A streak that ended yesterday still counts
 * today until the current day ends, so opening the app does not erase it.
 */
export function streakLength(activity: string[], now = new Date()): number {
  const days = new Set(activity);
  if (days.size === 0) return 0;
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!days.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dayKey(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function completedThisWeek(
  completed: Record<string, string>,
  now = new Date(),
): number {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - 6);
  return Object.values(completed).filter((timestamp) => {
    const date = new Date(timestamp);
    return !Number.isNaN(date.getTime()) && date >= start;
  }).length;
}
