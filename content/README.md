# Random Tech — content pipeline

The runtime never invents topics. Everything the website shows comes from validated
records in `src/data/library.json`, generated from the authoring files in this folder.

## Authoring files

```
content/
├── categories.json        # taxonomy: 39 fields, families, icons, helpful background
└── topics/
    ├── ai-ml.txt          # one file per category slug
    ├── databases.txt
    └── …
```

Each topic is one line with pipe-separated fields:

```
title | difficulty | focus | summary | whyItMatters | researchQuestion | tags | flags
```

| Field | Rules |
| --- | --- |
| `title` | 18–120 characters, a researchable question ending in `?` |
| `difficulty` | `Beginner`, `Intermediate`, or `Advanced` |
| `focus` | Sub-area inside the category (e.g. `Consensus`) |
| `summary` | 60–320 characters describing the mechanism, not just the term |
| `whyItMatters` | 40–260 characters on engineering relevance |
| `researchQuestion` | 20–220 characters, ends in `?` |
| `tags` | 2–5 comma-separated, lowercase, hyphenated tags |
| `flags` | optional: `ai` (AI-era relevance) or `emerging` |

Topic IDs, category counts, difficulty counts, and AI relevance are derived by the
build. Do not hand-edit `src/data/library.json`.

## Build and validate

```bash
npm run library:build    # validate sources and regenerate the runtime dataset
npm run library:check    # CI guard: fails if the committed dataset is stale
npm run test             # dataset invariants, search, draw fairness, related topics
```

The builder rejects the whole batch on any error, including:

- duplicate or near-duplicate titles (token similarity within a field),
- malformed metadata, tags, or flags,
- a category with fewer than eight topics,
- files that do not map to a declared category.

## Current state (honest accounting)

This release ships **358 reviewed topics across 39 fields** (the number of live records is
shown in the app and the build output; this document is updated with each content batch). That is not 10,000, and the
interface never claims otherwise — counts shown in the product are read from the dataset.
The target is a 10,000+ library built in validated batches, not inflated with generated
variations. The schema, ingestion, deduplication, and runtime data-access seam are ready
for that expansion.

## Reaching 10,000 without sacrificing quality

1. **Knowledge map.** `categories.json` defines the top-level map; each field's
   `subfields` lists candidate concept areas. Expand subfields into concept lists before
   writing titles.
2. **Batch authoring.** Add a batch of 15–40 topics per field, written by someone who can
   name the actual mechanism. Keep batches in reviewable commits.
3. **Candidate validation.** Every title must pass the schema checks and the ten quality
   rules in the product brief: teaches a concept, technically meaningful, scoped to ~15
   minutes, evergreen or durably relevant, non-duplicative, and worth an engineer's time.
4. **Deduplication.** The build normalizes titles and rejects token-similar titles within a
   field. For cross-field overlap, add canonical concept IDs to the source format before
   scaling past a few thousand records.
5. **Storage migration.** When the dataset outgrows a bundled JSON module, replace the
   `src/lib/library.ts` data seam with a compact search index plus per-category detail
   shards (or a read-only API). Components only consume the types and selectors exported
   there, so this is an isolated change.
6. **Review gates.** `library:check` and `test` run in CI; a batch cannot ship while a
   category is under-covered or a duplicate title exists.

## Editorial standard

Prefer a smaller library of questions that change how someone builds software over a
larger library of definitions. If a topic can be answered by a dictionary sentence,
it does not belong here.
