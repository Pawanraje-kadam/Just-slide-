import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icons';
import { TopicDetailModal } from '../components/TopicDetailModal';
import { TopicGridCard } from '../components/TopicGridCard';
import {
  categories,
  categoryBySlug,
  filterTopics,
  libraryStats,
  topicById,
} from '../lib/library';
import { usePageMeta } from '../lib/meta';
import { useSaved } from '../providers/SavedProvider';
import type { Difficulty, DifficultyFilter, Topic } from '../types';

type SortOption = 'curated' | 'title' | 'difficulty';

const PAGE_SIZE = 24;
const difficultyOptions: DifficultyFilter[] = ['Any', 'Beginner', 'Intermediate', 'Advanced'];

function isDifficulty(value: string | null): value is Difficulty {
  return value === 'Beginner' || value === 'Intermediate' || value === 'Advanced';
}

export function Explore() {
  usePageMeta(
    'Explore the knowledge library',
    `Browse ${libraryStats.topics} curated computer science topics across ${libraryStats.categories} fields. Search by concept, filter by difficulty, and research what matters.`,
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const { getNote } = useSaved();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const query = searchParams.get('q') ?? '';
  const deferredQuery = useDeferredValue(query);
  const categoryParam = searchParams.get('category');
  const category =
    categoryParam && categoryBySlug.has(categoryParam) ? categoryParam : null;
  const difficultyParam = searchParams.get('difficulty');
  const difficulty: DifficultyFilter = isDifficulty(difficultyParam) ? difficultyParam : 'Any';
  const aiOnly = searchParams.get('ai') === '1';
  const sortParam = searchParams.get('sort');
  const sort: SortOption =
    sortParam === 'title' || sortParam === 'difficulty' ? sortParam : 'curated';
  const topicParam = searchParams.get('topic');
  const activeTopic = topicParam ? topicById.get(topicParam) ?? null : null;

  const results = useMemo(
    () =>
      filterTopics({
        query: deferredQuery,
        category,
        difficulty,
        aiOnly,
        sort,
      }),
    [deferredQuery, category, difficulty, aiOnly, sort],
  );

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [deferredQuery, category, difficulty, aiOnly, sort]);

  const visible = results.slice(0, visibleCount);
  const activeFilterCount = (category ? 1 : 0) + (difficulty !== 'Any' ? 1 : 0) + (aiOnly ? 1 : 0);

  const updateParam = (key: string, value: string | null, replace = false) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace });
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    if (searchParams.get('topic')) next.set('topic', searchParams.get('topic') ?? '');
    setSearchParams(next, { replace: true });
  };

  const openTopic = (topic: Topic) => updateParam('topic', topic.id);
  const closeTopic = () => updateParam('topic', null);

  return (
    <>
      <section className="page-head container">
        <div className="page-head__copy">
          <p className="eyebrow">
            <Icon name="layers" size={13} />
            The knowledge library
          </p>
          <h1>Explore what&rsquo;s worth knowing.</h1>
          <p className="page-head__lede">
            Search {libraryStats.topics} curated questions across {libraryStats.categories} fields of
            computer science. Every entry is evergreen, specific, and scoped to about fifteen
            minutes of real research.
          </p>
          <div className="page-head__meta">
            <span className="meta-pill">
              <Icon name="check" size={14} /> Fully curated
            </span>
            <span className="meta-pill">
              <Icon name="clock" size={14} /> 15 min each
            </span>
            <span className="meta-pill">
              <Icon name="layers" size={14} /> No duplicates
            </span>
          </div>
        </div>
        <div className="page-head__deco" aria-hidden="true">
          <span className="deco-card deco-card--back">
            <Icon name="database" size={22} />
          </span>
          <span className="deco-card deco-card--mid">
            <Icon name="network" size={22} />
          </span>
          <span className="deco-card deco-card--front">
            <span className="deco-lines">
              <span />
              <span />
              <span />
            </span>
            <Icon name="spark" size={26} />
          </span>
        </div>
      </section>

      <section className="library container" aria-labelledby="library-results-heading">
        <h2 id="library-results-heading" className="sr-only">
          Topic results
        </h2>
        <div className="library-search">
          <form role="search" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="library-search-input" className="sr-only">
              Search topics, tags, or categories
            </label>
            <span className="library-search__icon" aria-hidden="true">
              <Icon name="search" size={20} />
            </span>
            <input
              id="library-search-input"
              type="text"
              value={query}
              onChange={(event) => updateParam('q', event.target.value || null, true)}
              placeholder="Search consensus, cache invalidation, tokenization…"
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button
                type="button"
                className="search-clear"
                onClick={() => updateParam('q', null, true)}
                aria-label="Clear search"
              >
                <Icon name="close" size={16} />
              </button>
            )}
          </form>
          <span className="library-search__hint">
            Search titles, tags, summaries, and fields
          </span>
        </div>

        <div className="library-toolbar">
          <div className="toolbar-control">
            <label htmlFor="filter-category" className="toolbar-label">
              Field
            </label>
            <div className="select-wrap select-wrap--compact">
              <select
                id="filter-category"
                value={category ?? ''}
                onChange={(event) => updateParam('category', event.target.value || null, true)}
              >
                <option value="">All fields</option>
                {[...categories]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((entry) => (
                    <option key={entry.slug} value={entry.slug}>
                      {entry.name} ({entry.count})
                    </option>
                  ))}
              </select>
              <Icon name="chevronDown" size={15} />
            </div>
          </div>

          <fieldset className="toolbar-control toolbar-control--difficulty">
            <legend className="toolbar-label">Difficulty</legend>
            <div className="segmented segmented--compact">
              {difficultyOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`segmented__item${difficulty === option ? ' is-active' : ''}`}
                  aria-pressed={difficulty === option}
                  onClick={() => updateParam('difficulty', option === 'Any' ? null : option, true)}
                >
                  {option === 'Any' ? 'Any' : option}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="switch-control">
            <input
              type="checkbox"
              checked={aiOnly}
              onChange={(event) => updateParam('ai', event.target.checked ? '1' : null, true)}
            />
            <span className="switch-control__track" aria-hidden="true">
              <span />
            </span>
            <span className="switch-control__label">AI-era only</span>
          </label>

          <div className="toolbar-control toolbar-control--sort">
            <label htmlFor="filter-sort" className="toolbar-label">
              Sort
            </label>
            <div className="select-wrap select-wrap--compact">
              <select
                id="filter-sort"
                value={sort}
                onChange={(event) =>
                  updateParam('sort', event.target.value === 'curated' ? null : event.target.value, true)
                }
              >
                <option value="curated">Curated order</option>
                <option value="title">A–Z</option>
                <option value="difficulty">Difficulty</option>
              </select>
              <Icon name="chevronDown" size={15} />
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button type="button" className="text-action toolbar-reset" onClick={clearFilters}>
              <Icon name="rotate" size={14} /> Clear filters
            </button>
          )}
        </div>

        <div className="library-status">
          <p aria-live="polite" role="status">
            <strong>{results.length}</strong> {results.length === 1 ? 'topic' : 'topics'}
            {deferredQuery ? (
              <>
                {' '}matching <span className="status-query">“{deferredQuery}”</span>
              </>
            ) : null}
            {category ? <> in {categoryBySlug.get(category)?.name}</> : null}
          </p>
          {results.length > 0 && (
            <span className="library-status__range">
              Showing {Math.min(visible.length, results.length)} of {results.length}
            </span>
          )}
        </div>

        {activeFilterCount > 0 && (
          <div className="active-filters" aria-label="Active filters">
            {category && (
              <button type="button" className="filter-chip" onClick={() => updateParam('category', null, true)}>
                {categoryBySlug.get(category)?.name}
                <Icon name="close" size={13} />
                <span className="sr-only">Remove field filter</span>
              </button>
            )}
            {difficulty !== 'Any' && (
              <button
                type="button"
                className="filter-chip"
                onClick={() => updateParam('difficulty', null, true)}
              >
                {difficulty}
                <Icon name="close" size={13} />
                <span className="sr-only">Remove difficulty filter</span>
              </button>
            )}
            {aiOnly && (
              <button type="button" className="filter-chip" onClick={() => updateParam('ai', null, true)}>
                AI-era only
                <Icon name="close" size={13} />
                <span className="sr-only">Remove AI-era filter</span>
              </button>
            )}
          </div>
        )}

        {results.length === 0 ? (
          <div className="empty-panel">
            <span className="empty-panel__glyph" aria-hidden="true">
              <Icon name="search" size={30} />
            </span>
            <h2>No topics match that combination.</h2>
            <p>
              Try a broader search, a different field, or clear the difficulty filter. The library
              favours depth over keyword stuffing.
            </p>
            <button type="button" className="btn btn--primary btn--sm" onClick={clearFilters}>
              <Icon name="rotate" size={15} /> Reset the library
            </button>
          </div>
        ) : (
          <>
            <div className="topic-grid">
              {visible.map((topic) => (
                <TopicGridCard
                  key={topic.id}
                  topic={topic}
                  onOpen={openTopic}
                  note={getNote(topic.id)?.text}
                />
              ))}
            </div>

            {visible.length < results.length && (
              <div className="load-more">
                <button
                  type="button"
                  className="btn btn--clay"
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                >
                  <Icon name="layers" size={17} />
                  Load more topics
                  <span className="load-more__count">
                    {results.length - visible.length} remaining
                  </span>
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <TopicDetailModal
        topic={activeTopic}
        onClose={closeTopic}
        onSelectTopic={openTopic}
      />
    </>
  );
}

