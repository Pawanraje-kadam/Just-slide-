import rawLibrary from '../data/library.json';
import type { Category, LibraryData, Topic } from '../types';

function isTopic(value: unknown): value is Topic {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.title === 'string' &&
    typeof record.categorySlug === 'string' &&
    typeof record.summary === 'string' &&
    Array.isArray(record.tags) &&
    (record.difficulty === 'Beginner' ||
      record.difficulty === 'Intermediate' ||
      record.difficulty === 'Advanced')
  );
}

const data = rawLibrary as unknown as LibraryData;

export const topics: Topic[] = Array.isArray(data.topics) ? data.topics.filter(isTopic) : [];

export const categories: Category[] = Array.isArray(data.categories) ? data.categories : [];

if (topics.length !== data.counts?.topics) {
  // eslint-disable-next-line no-console
  console.warn(
    `[Random Tech] Topic dataset count mismatch: expected ${data.counts?.topics}, loaded ${topics.length}.`,
  );
}

export const topicById = new Map<string, Topic>(topics.map((topic) => [topic.id, topic]));
export const categoryBySlug = new Map<string, Category>(
  categories.map((category) => [category.slug, category]),
);
export const topicNumber = new Map<string, number>(
  topics.map((topic, index) => [topic.id, index + 1]),
);

export const libraryStats = {
  topics: topics.length,
  categories: categories.length,
  fields: categories.length,
};

export function categoryFor(topic: Topic): Category | undefined {
  return categoryBySlug.get(topic.categorySlug);
}

export function categoryName(slug: string): string {
  return categoryBySlug.get(slug)?.name ?? slug;
}

export const searchableText = new Map<string, string>(
  topics.map((topic) => [
    topic.id,
    [
      topic.title,
      topic.category,
      topic.subcategories.join(' '),
      topic.summary,
      topic.whyItMatters,
      topic.researchQuestion,
      topic.tags.join(' '),
    ]
      .join(' ')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, ''),
  ]),
);

export function normalizeQuery(input: string): string[] {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export interface SearchOptions {
  query: string;
  category: string | null;
  difficulty: string;
  aiOnly: boolean;
  sort: 'curated' | 'title' | 'difficulty';
}

const difficultyRank = { Beginner: 1, Intermediate: 2, Advanced: 3 } as const;

export function filterTopics(options: SearchOptions): Topic[] {
  const terms = normalizeQuery(options.query);
  const scored: Array<{ topic: Topic; score: number; index: number }> = [];

  topics.forEach((topic, index) => {
    if (options.category && topic.categorySlug !== options.category) return;
    if (options.difficulty !== 'Any' && topic.difficulty !== options.difficulty) return;
    if (options.aiOnly && !topic.aiRelevance) return;

    const haystack = searchableText.get(topic.id) ?? topic.title.toLowerCase();
    if (!terms.every((term) => haystack.includes(term))) return;

    let score = 0;
    if (terms.length) {
      const title = topic.title.toLowerCase();
      const phrase = options.query.trim().toLowerCase();
      if (phrase && title.includes(phrase)) score += 30;
      for (const term of terms) {
        if (title.includes(term)) score += 8;
        if (topic.tags.some((tag) => tag.includes(term))) score += 4;
        if (topic.category.toLowerCase().includes(term)) score += 3;
      }
      score += topic.aiRelevance ? 0.5 : 0;
    }
    scored.push({ topic, score, index });
  });

  if (options.sort === 'title') {
    scored.sort((a, b) => a.topic.title.localeCompare(b.topic.title));
  } else if (options.sort === 'difficulty') {
    scored.sort(
      (a, b) =>
        difficultyRank[a.topic.difficulty] - difficultyRank[b.topic.difficulty] ||
        a.topic.title.localeCompare(b.topic.title),
    );
  } else if (terms.length) {
    scored.sort((a, b) => b.score - a.score || a.index - b.index);
  } else {
    scored.sort((a, b) => a.index - b.index);
  }

  return scored.map((entry) => entry.topic);
}

/** Related topics are scored by real metadata overlap, never random selection. */
export function relatedTopics(topic: Topic, limit = 4): Topic[] {
  const topicTags = new Set(topic.tags);
  const scored = topics
    .filter((candidate) => candidate.id !== topic.id)
    .map((candidate) => {
      let score = 0;
      if (candidate.categorySlug === topic.categorySlug) score += 4;
      for (const tag of candidate.tags) if (topicTags.has(tag)) score += 3;
      for (const sub of candidate.subcategories) {
        if (topic.subcategories.includes(sub)) score += 1;
      }
      if (candidate.difficulty === topic.difficulty) score += 0.5;
      return { candidate, score };
    })
    .filter((entry) => entry.score >= 3)
    .sort(
      (a, b) =>
        b.score - a.score || a.candidate.title.localeCompare(b.candidate.title),
    );

  return scored.slice(0, limit).map((entry) => entry.candidate);
}
