import type { CollectionValue, DifficultyFilter, FocusPreset, Topic } from '../types';
import { categories, libraryStats, topics } from './library';

export const focusPresets: Array<{
  id: FocusPreset;
  label: string;
  shortLabel: string;
  description: string;
  categorySlugs: string[];
}> = [
  {
    id: 'anything',
    label: 'Anything goes',
    shortLabel: 'All fields',
    description: `Sample the whole library with balanced coverage across ${libraryStats.categories} fields.`,
    categorySlugs: [],
  },
  {
    id: 'ai',
    label: 'AI and its edges',
    shortLabel: 'AI-era',
    description: 'Models, inference, evaluation, agents, and how AI changes engineering.',
    categorySlugs: ['ai-ml', 'ai-engineering', 'ai-assisted-dev', 'nlp', 'vision', 'rl'],
  },
  {
    id: 'systems',
    label: 'Systems and infrastructure',
    shortLabel: 'Systems',
    description: 'Operating systems, distributed systems, networking, storage, and reliability.',
    categorySlugs: [
      'operating-systems',
      'distributed-systems',
      'computer-architecture',
      'networking',
      'databases',
      'cloud',
      'datacenter',
      'system-design',
      'performance',
      'sre',
    ],
  },
  {
    id: 'security',
    label: 'Trust and security',
    shortLabel: 'Security',
    description: 'Threats, cryptography, supply chain, privacy, and defensive design.',
    categorySlugs: ['cybersecurity', 'cryptography', 'supply-chain', 'privacy'],
  },
  {
    id: 'theory',
    label: 'Theory and languages',
    shortLabel: 'Theory',
    description: 'Algorithms, complexity, type systems, compilers, and semantics.',
    categorySlugs: ['algorithms', 'theory', 'programming-languages', 'compilers', 'search'],
  },
  {
    id: 'craft',
    label: 'The engineering craft',
    shortLabel: 'Craft',
    description: 'Architecture, backend, frontend, testing, tooling, product, and economics.',
    categorySlugs: [
      'software-architecture',
      'backend',
      'frontend',
      'apis',
      'testing',
      'devops',
      'developer-tools',
      'open-source',
      'economics',
      'product',
      'hci',
    ],
  },
];

export function focusFor(collection: CollectionValue) {
  return focusPresets.find((preset) => preset.id === collection);
}

export function matchesCollection(topic: Topic, collection: CollectionValue): boolean {
  if (collection.startsWith('category:')) {
    return topic.categorySlug === collection.slice('category:'.length);
  }
  if (collection === 'anything') return true;
  if (collection === 'ai') return topic.aiRelevance;
  const preset = focusFor(collection);
  return preset ? preset.categorySlugs.includes(topic.categorySlug) : true;
}

export function collectionLabel(collection: CollectionValue): string {
  if (collection.startsWith('category:')) {
    const slug = collection.slice('category:'.length);
    return categories.find((category) => category.slug === slug)?.name ?? 'Selected field';
  }
  if (collection === 'anything') return 'All fields';
  return focusPresets.find((preset) => preset.id === collection)?.label ?? 'All fields';
}

export interface DrawOptions {
  collection: CollectionValue;
  difficulty: DifficultyFilter;
  excludeIds?: string[];
  currentId?: string;
}

function randomIndex(length: number): number {
  if (length <= 0) return 0;
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return (buffer[0] ?? 0) % length;
  }
  return Math.floor(Math.random() * length);
}

/**
 * Draw a topic with category-balanced sampling. Each represented category has an
 * equal chance regardless of dataset size, so large fields cannot dominate.
 * Recently seen and the current topic are excluded until the eligible pool dries up.
 */
export function drawTopic({
  collection,
  difficulty,
  excludeIds = [],
  currentId,
}: DrawOptions): Topic | null {
  let pool = topics.filter((topic) => matchesCollection(topic, collection));
  if (difficulty !== 'Any') pool = pool.filter((topic) => topic.difficulty === difficulty);
  if (pool.length === 0) return null;

  const excluded = new Set(excludeIds);
  const unseen = pool.filter((topic) => !excluded.has(topic.id));
  if (unseen.length > 0) pool = unseen;
  else if (currentId) {
    const notCurrent = pool.filter((topic) => topic.id !== currentId);
    if (notCurrent.length > 0) pool = notCurrent;
  }

  const byCategory = new Map<string, Topic[]>();
  for (const topic of pool) {
    const group = byCategory.get(topic.categorySlug);
    if (group) group.push(topic);
    else byCategory.set(topic.categorySlug, [topic]);
  }
  const groups = [...byCategory.values()];
  const group = groups[randomIndex(groups.length)] ?? pool;
  return group[randomIndex(group.length)] ?? pool[0] ?? null;
}
