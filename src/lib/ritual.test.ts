import { describe, expect, it } from 'vitest';
import {
  completedThisWeek,
  dayKey,
  streakLength,
  withCompletion,
  withToday,
} from './progress';
import {
  createDraft,
  formatTime,
  loadDraft,
  parseSource,
  saveDraft,
  spokenTime,
} from './ritual';
import { storageKeys, writeJSON } from './storage';

function daysAgo(count: number): string {
  const date = new Date();
  date.setDate(date.getDate() - count);
  return dayKey(date);
}

describe('progress ledger', () => {
  it('keeps one entry per day, most recent first', () => {
    const today = dayKey();
    const once = withToday({ completed: {}, activity: [] }, today);
    expect(once.activity).toEqual([today]);
    expect(withToday(once, today)).toBe(once);
    expect(withToday({ completed: {}, activity: ['2026-01-01'] }, today).activity).toEqual([
      today,
      '2026-01-01',
    ]);
    expect(withToday(once, today).activity).toHaveLength(1);
  });

  it('records completion dates without losing activity', () => {
    const state = withCompletion({ completed: {}, activity: [] }, 'topic-a');
    expect(state.completed['topic-a']).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(state.activity).toContain(dayKey());
  });

  it('counts consecutive days, including a streak that ended yesterday', () => {
    expect(streakLength([])).toBe(0);
    expect(streakLength([daysAgo(0), daysAgo(1), daysAgo(2)])).toBe(3);
    expect(streakLength([daysAgo(1), daysAgo(2)])).toBe(2);
    expect(streakLength([daysAgo(0), daysAgo(2)])).toBe(1);
    expect(streakLength([daysAgo(3), daysAgo(4)])).toBe(0);
  });

  it('counts sessions finished in the last seven days', () => {
    const now = new Date(2026, 9, 20, 12);
    const completed = {
      recent: new Date(2026, 9, 19, 12).toISOString(),
      older: new Date(2026, 9, 1, 12).toISOString(),
    };
    expect(completedThisWeek(completed, now)).toBe(1);
  });
});

describe('source capture', () => {
  it('normalises links and keeps a readable label', () => {
    const parsed = parseSource('https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching');
    expect(parsed.url).toBe('https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching');
    expect(parsed.label).toContain('developer.mozilla.org');

    const bare = parseSource('example.com/paper');
    expect(bare.url).toBe('https://example.com/paper');
    expect(bare.label).toBe('example.com/paper');
  });

  it('leaves plain references alone', () => {
    expect(parseSource('CMU 15-213, lecture 12')).toEqual({ label: 'CMU 15-213, lecture 12' });
    expect(parseSource('   ').label).toBe('');
  });
});

describe('session persistence', () => {
  it('round-trips everything the reader wrote', () => {
    const draft = {
      ...createDraft(),
      answer: 'The mechanism is…',
      learned: 'It matters because…',
      checked: [true, false, true, false, false],
    };
    expect(typeof saveDraft('test-topic', draft)).toBe('boolean');
    const restored = loadDraft('test-topic');
    expect(restored.answer).toBe('The mechanism is…');
    expect(restored.learned).toBe('It matters because…');
    expect(restored.checked).toEqual([true, false, true, false, false]);
  });

  it('migrates a legacy checklist-only session', () => {
    writeJSON(storageKeys.checklist('legacy-topic'), [true, true, false, false, false]);
    const draft = loadDraft('legacy-topic');
    expect(draft.checked).toEqual([true, true, false, false, false]);
    expect(draft.answer).toBe('');
  });

  it('restores a timer that kept running', () => {
    saveDraft('timed-topic', {
      ...createDraft(),
      started: true,
      endAt: Date.now() + 60_000,
      remaining: 900,
    });
    const draft = loadDraft('timed-topic');
    expect(draft.remaining).toBeGreaterThan(55);
    expect(draft.remaining).toBeLessThanOrEqual(60);
  });

  it('formats clock and screen-reader times', () => {
    expect(formatTime(900)).toBe('15:00');
    expect(formatTime(65)).toBe('01:05');
    expect(spokenTime(900)).toBe('15 minutes');
    expect(spokenTime(61)).toBe('1 minute 1 second');
  });
});
