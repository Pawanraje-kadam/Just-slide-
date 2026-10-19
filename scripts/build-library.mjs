#!/usr/bin/env node
/**
 * Random Tech library builder.
 *
 * Source of truth: content/categories.json + content/topics/<category>.txt
 * Each topic line: title | difficulty | focus | summary | whyItMatters | researchQuestion | tags | flags
 *
 * The builder validates the collection (unique titles, valid categories, complete
 * metadata, sane length, no near-duplicate titles) and emits the runtime dataset
 * consumed by the app. `--check` verifies the committed dataset is up to date
 * without writing anything.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = join(root, 'content');
const topicsDir = join(contentDir, 'topics');
const outFile = join(root, 'src', 'data', 'library.json');
const checkMode = process.argv.includes('--check');
const DIFFICULTIES = new Set(['Beginner', 'Intermediate', 'Advanced']);
const KNOWN_FLAGS = new Set(['ai', 'emerging']);
const errors = [];

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

function fail(message) {
  errors.push(message);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

function normalizeTitle(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function words(value) {
  return normalizeTitle(value)
    .split(' ')
    .filter((word) => word.length > 3);
}

function jaccard(a, b) {
  const setA = new Set(words(a));
  const setB = new Set(words(b));
  if (!setA.size || !setB.size) return 0;
  let intersection = 0;
  for (const item of setA) if (setB.has(item)) intersection += 1;
  return intersection / (setA.size + setB.size - intersection);
}

const categories = readJson(join(contentDir, 'categories.json'));
if (!Array.isArray(categories) || categories.length === 0) fail('categories.json must be a non-empty array');

const categoryBySlug = new Map();
for (const category of categories) {
  for (const field of ['slug', 'name', 'shortName', 'description', 'family', 'icon']) {
    if (!category[field]) fail(`category "${category.slug ?? '?'}" is missing ${field}`);
  }
  if (!Array.isArray(category.subfields) || category.subfields.length < 2) {
    fail(`category "${category.slug}" needs at least two subfields`);
  }
  if (categoryBySlug.has(category.slug)) fail(`duplicate category slug: ${category.slug}`);
  categoryBySlug.set(category.slug, category);
}

const files = readdirSync(topicsDir)
  .filter((name) => name.endsWith('.txt'))
  .sort();

for (const fileName of files) {
  const slug = basename(fileName, '.txt');
  if (!categoryBySlug.has(slug)) fail(`${fileName}: no matching category for slug "${slug}"`);
}

const topics = [];
const ids = new Set();
const titles = new Map();
const titlesByCategory = new Map();

for (const fileName of files) {
  const slug = basename(fileName, '.txt');
  const category = categoryBySlug.get(slug);
  if (!category) continue;
  const categoryTitles = [];
  titlesByCategory.set(slug, categoryTitles);

  const raw = readFileSync(join(topicsDir, fileName), 'utf8');
  const lines = raw.split(/\r?\n/);

  lines.forEach((rawLine, index) => {
    const location = `${fileName}:${index + 1}`;
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) return;

    const fields = line.split('|').map((field) => field.trim());
    if (fields.length < 7) {
      fail(`${location}: expected 7 fields separated by "|", found ${fields.length}`);
      return;
    }
    if (fields.length > 8) {
      fail(`${location}: expected at most 8 fields, found ${fields.length}`);
      return;
    }

    const [title, difficulty, focus, summary, whyItMatters, researchQuestion, tagField, flagField = ''] = fields;

    if (title.length < 18 || title.length > 120) fail(`${location}: title length ${title.length} outside 18-120`);
    if (!/[?]$/.test(title)) fail(`${location}: title should be a researchable question ending in "?"`);
    if (!DIFFICULTIES.has(difficulty)) fail(`${location}: invalid difficulty "${difficulty}"`);
    if (!focus) fail(`${location}: missing focus/subcategory`);
    if (summary.length < 60 || summary.length > 320) fail(`${location}: summary length ${summary.length} outside 60-320`);
    if (whyItMatters.length < 40 || whyItMatters.length > 260) fail(`${location}: whyItMatters length outside 40-260`);
    if (researchQuestion.length < 20 || researchQuestion.length > 220) fail(`${location}: researchQuestion length outside 20-220`);
    if (!/[?]$/.test(researchQuestion)) fail(`${location}: researchQuestion should end in "?"`);

    const tags = tagField.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean);
    if (tags.length < 2 || tags.length > 5) fail(`${location}: expected 2-5 tags, found ${tags.length}`);
    for (const tag of tags) {
      if (!/^[a-z0-9][a-z0-9 +._-]{1,32}$/.test(tag)) fail(`${location}: invalid tag "${tag}"`);
    }

    const flags = flagField ? flagField.split(',').map((flag) => flag.trim()).filter(Boolean) : [];
    for (const flag of flags) {
      if (!KNOWN_FLAGS.has(flag)) fail(`${location}: unknown flag "${flag}"`);
    }

    const normalized = normalizeTitle(title);
    if (titles.has(normalized)) {
      fail(`${location}: duplicate title (also ${titles.get(normalized)}) -> "${title}"`);
    }
    for (const previous of categoryTitles) {
      if (jaccard(previous, title) >= 0.72) {
        fail(`${location}: near-duplicate of "${previous}" in ${slug} -> "${title}"`);
      }
    }
    titles.set(normalized, location);
    categoryTitles.push(title);

    let id = `${slug}-${slugify(title)}`;
    if (ids.has(id)) {
      fail(`${location}: duplicate generated id ${id}`);
      id = `${id}-duplicate`;
    }
    ids.add(id);

    const isAi = ['ai-ml', 'ai-engineering', 'ai-assisted-dev'].includes(slug) || flags.includes('ai');
    topics.push({
      id,
      title,
      category: category.name,
      categorySlug: category.slug,
      subcategories: [focus],
      difficulty,
      estimatedMinutes: 15,
      evergreen: true,
      aiRelevance: isAi,
      emerging: flags.includes('emerging'),
      summary,
      whyItMatters,
      researchQuestion,
      tags,
    });
  });
}

for (const category of categories) {
  const count = topics.filter((topic) => topic.categorySlug === category.slug).length;
  if (count < 8) fail(`category "${category.slug}" has only ${count} topics; minimum is 8`);
}

if (errors.length) {
  console.error(`\nLibrary validation failed with ${errors.length} issue(s):\n`);
  for (const error of errors) console.error(`  ✗ ${error}`);
  console.error('');
  process.exit(1);
}

const categoryStats = {};
for (const category of categories) {
  const inCategory = topics.filter((topic) => topic.categorySlug === category.slug);
  categoryStats[category.slug] = {
    count: inCategory.length,
    beginner: inCategory.filter((topic) => topic.difficulty === 'Beginner').length,
    intermediate: inCategory.filter((topic) => topic.difficulty === 'Intermediate').length,
    advanced: inCategory.filter((topic) => topic.difficulty === 'Advanced').length,
  };
}

const payload = {
  version: 1,
  counts: {
    topics: topics.length,
    categories: categories.length,
  },
  categories: categories.map((category) => ({
    ...category,
    count: categoryStats[category.slug].count,
    difficultyCounts: {
      Beginner: categoryStats[category.slug].beginner,
      Intermediate: categoryStats[category.slug].intermediate,
      Advanced: categoryStats[category.slug].advanced,
    },
  })),
  topics,
};

const serialized = `${JSON.stringify(payload, null, 2)}\n`;
const digest = createHash('sha256').update(serialized).digest('hex').slice(0, 12);

if (checkMode) {
  if (!existsSync(outFile)) {
    console.error('Dataset has not been generated. Run `npm run library:build`.');
    process.exit(1);
  }
  const current = readFileSync(outFile, 'utf8');
  if (current !== serialized) {
    console.error('Dataset is stale. Run `npm run library:build` and commit the result.');
    process.exit(1);
  }
  console.log(`Dataset is current: ${topics.length} topics across ${categories.length} categories (${digest}).`);
  process.exit(0);
}

writeFileSync(outFile, serialized);
console.log(
  `Built ${topics.length} topics across ${categories.length} categories -> src/data/library.json (${digest})`,
);
