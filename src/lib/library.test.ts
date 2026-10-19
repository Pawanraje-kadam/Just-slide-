import { describe, expect, it } from 'vitest';
import {
  categories,
  filterTopics,
  normalizeQuery,
  relatedTopics,
  topics,
  topicById,
} from './library';
import { drawTopic, matchesCollection } from './selection';
import type { CollectionValue } from '../types';

describe('library dataset', () => {
  it('loads topics and categories with stable unique ids', () => {
    expect(topics.length).toBeGreaterThan(300);
    expect(categories.length).toBe(39);
    expect(new Set(topics.map((topic) => topic.id)).size).toBe(topics.length);
    expect(new Set(topics.map((topic) => topic.title.toLowerCase())).size).toBe(topics.length);
  });

  it('gives every topic complete, valid metadata', () => {
    for (const topic of topics) {
      expect(topic.title.endsWith('?')).toBe(true);
      expect(topic.title.length).toBeGreaterThanOrEqual(18);
      expect(['Beginner', 'Intermediate', 'Advanced']).toContain(topic.difficulty);
      expect(topic.estimatedMinutes).toBe(15);
      expect(topic.summary.length).toBeGreaterThanOrEqual(60);
      expect(topic.whyItMatters.length).toBeGreaterThanOrEqual(40);
      expect(topic.researchQuestion.endsWith('?')).toBe(true);
      expect(topic.tags.length).toBeGreaterThanOrEqual(2);
      expect(categories.some((category) => category.slug === topic.categorySlug)).toBe(true);
    }
  });

  it('has no near-duplicate titles within a field', () => {
    const byCategory = new Map<string, string[]>();
    for (const topic of topics) {
      const list = byCategory.get(topic.categorySlug) ?? [];
      list.push(topic.title);
      byCategory.set(topic.categorySlug, list);
    }
    for (const titles of byCategory.values()) {
      const normalized = titles.map((title) => normalizeQuery(title).join(' '));
      expect(new Set(normalized).size).toBe(normalized.length);
    }
  });

  it('keeps every category above the minimum coverage bar', () => {
    for (const category of categories) {
      const count = topics.filter((topic) => topic.categorySlug === category.slug).length;
      expect(count).toBeGreaterThanOrEqual(8);
      expect(category.count).toBe(count);
    }
  });
});

describe('search and filtering', () => {
  const base = { category: null, difficulty: 'Any', aiOnly: false, sort: 'curated' } as const;

  it('matches titles, tags, and summaries', () => {
    const byTitle = filterTopics({ ...base, query: 'consensus' });
    expect(byTitle.some((topic) => topic.title.includes('Consensus'))).toBe(true);

    const byTag = filterTopics({ ...base, query: 'bloom-filters' });
    expect(byTag[0]?.title).toMatch(/Bloom/i);

    const bySummary = filterTopics({ ...base, query: 'write amplification' });
    expect(bySummary.length).toBeGreaterThan(0);
  });

  it('applies category, difficulty, and AI filters together', () => {
    const filtered = filterTopics({
      query: '',
      category: 'distributed-systems',
      difficulty: 'Advanced',
      aiOnly: false,
      sort: 'curated',
    });
    expect(filtered.length).toBeGreaterThan(0);
    for (const topic of filtered) {
      expect(topic.categorySlug).toBe('distributed-systems');
      expect(topic.difficulty).toBe('Advanced');
    }

    const aiOnly = filterTopics({ ...base, query: '', aiOnly: true });
    expect(aiOnly.length).toBeGreaterThan(0);
    expect(aiOnly.every((topic) => topic.aiRelevance)).toBe(true);
  });

  it('returns an empty list instead of throwing for impossible queries', () => {
    expect(filterTopics({ ...base, query: 'zzzz-no-such-topic' })).toEqual([]);
    expect(
      filterTopics({
        query: '',
        category: 'databases',
        difficulty: 'Beginner',
        aiOnly: true,
        sort: 'title',
      }),
    ).toEqual([]);
  });

  it('is deterministic under sorting', () => {
    const titles = filterTopics({ ...base, query: '', sort: 'title' }).map((topic) => topic.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
  });
});

describe('draw engine', () => {
  const collections: CollectionValue[] = ['anything', 'ai', 'systems', 'security', 'theory', 'craft'];

  it('always returns a topic inside the requested collection and difficulty', () => {
    for (const collection of collections) {
      for (const difficulty of ['Any', 'Beginner', 'Intermediate', 'Advanced'] as const) {
        const draws = Array.from({ length: 25 }, () =>
          drawTopic({ collection, difficulty }),
        );
        for (const topic of draws) {
          expect(topic).not.toBeNull();
          if (!topic) continue;
          expect(matchesCollection(topic, collection)).toBe(true);
          if (difficulty !== 'Any') expect(topic.difficulty).toBe(difficulty);
        }
      }
    }
  });

  it('avoids recently seen topics until the pool is exhausted', () => {
    const first = drawTopic({ collection: 'anything', difficulty: 'Any' });
    expect(first).not.toBeNull();
    const second = drawTopic({
      collection: 'anything',
      difficulty: 'Any',
      excludeIds: [first!.id],
      currentId: first!.id,
    });
    expect(second).not.toBeNull();
    expect(second?.id).not.toBe(first?.id);
  });

  it('stays within a specific field selection', () => {
    const topic = drawTopic({ collection: 'category:operating-systems', difficulty: 'Any' });
    expect(topic?.categorySlug).toBe('operating-systems');
  });

  it('returns null when a filter combination has no eligible topics', () => {
    const impossible = drawTopic({
      collection: 'category:cybersecurity',
      difficulty: 'Beginner',
    });
    const eligible = topics.some(
      (topic) => topic.categorySlug === 'cybersecurity' && topic.difficulty === 'Beginner',
    );
    if (eligible) expect(impossible).not.toBeNull();
    else expect(impossible).toBeNull();
  });

  it('offers every difficulty in every field', () => {
    for (const category of categories) {
      for (const difficulty of ['Beginner', 'Intermediate', 'Advanced'] as const) {
        const count = topics.filter(
          (topic) => topic.categorySlug === category.slug && topic.difficulty === difficulty,
        ).length;
        expect(count, `${category.slug} is missing ${difficulty}`).toBeGreaterThan(0);
      }
    }
  });

  it('spreads draws across categories rather than crowding one field', () => {
    const seen = new Set<string>();
    for (let index = 0; index < 120; index += 1) {
      const topic = drawTopic({ collection: 'anything', difficulty: 'Any' });
      if (topic) seen.add(topic.categorySlug);
    }
    expect(seen.size).toBeGreaterThan(25);
  });
});

describe('related topics', () => {
  it('never includes the origin topic and only returns real metadata overlap', () => {
    const origin = topicById.get('distributed-systems-why-do-distributed-systems-need-consensus-protocols');
    expect(origin).toBeDefined();
    if (!origin) return;
    const related = relatedTopics(origin, 4);
    expect(related.length).toBeGreaterThan(0);
    expect(related.some((topic) => topic.id === origin.id)).toBe(false);
    for (const topic of related) {
      const sharesTag = topic.tags.some((tag) => origin.tags.includes(tag));
      const sharesCategory = topic.categorySlug === origin.categorySlug;
      expect(sharesTag || sharesCategory).toBe(true);
    }
  });
});
