export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export type DifficultyFilter = Difficulty | 'Any';

export type FocusPreset = 'anything' | 'ai' | 'systems' | 'security' | 'theory' | 'craft';

export type CollectionValue = FocusPreset | `category:${string}`;

export type ColorFamily = 'lavender' | 'blue' | 'mint' | 'peach' | 'butter';

export type IconName =
  | 'spark'
  | 'server'
  | 'terminal'
  | 'nodes'
  | 'cpu'
  | 'layers'
  | 'network'
  | 'database'
  | 'compass'
  | 'code'
  | 'brackets'
  | 'shield'
  | 'lock'
  | 'cloud'
  | 'wrench'
  | 'gauge'
  | 'browser'
  | 'plug'
  | 'pipeline'
  | 'search'
  | 'sigma'
  | 'activity'
  | 'check'
  | 'branch'
  | 'box'
  | 'workflow'
  | 'eyeOff'
  | 'bulb'
  | 'robot'
  | 'camera'
  | 'chat'
  | 'target'
  | 'building'
  | 'package'
  | 'coins'
  | 'cursor'
  | 'orbit'
  | 'arrowUpRight'
  | 'arrowRight'
  | 'arrowLeft'
  | 'shuffle'
  | 'copy'
  | 'bookmark'
  | 'bookmarkFilled'
  | 'clock'
  | 'sliders'
  | 'close'
  | 'menu'
  | 'sun'
  | 'moon'
  | 'chevronDown'
  | 'chevronUp'
  | 'trash'
  | 'play'
  | 'pause'
  | 'rotate'
  | 'alert'
  | 'info'
  | 'externalLink'
  | 'listCheck'
  | 'sparkSmall'
  | 'timer';

export interface Topic {
  id: string;
  title: string;
  category: string;
  categorySlug: string;
  subcategories: string[];
  difficulty: Difficulty;
  estimatedMinutes: number;
  evergreen: boolean;
  aiRelevance: boolean;
  emerging: boolean;
  summary: string;
  whyItMatters: string;
  researchQuestion: string;
  tags: string[];
}

export interface Category {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  subfields: string[];
  family: ColorFamily;
  icon: IconName;
  foundation: string;
  count: number;
  difficultyCounts: Record<Difficulty, number>;
}

export interface LibraryData {
  version: number;
  counts: { topics: number; categories: number };
  categories: Category[];
  topics: Topic[];
}

export interface LibraryFilters {
  category: string | null;
  difficulty: DifficultyFilter;
  aiOnly: boolean;
}

export interface SavedNote {
  text: string;
  updatedAt: string;
}
