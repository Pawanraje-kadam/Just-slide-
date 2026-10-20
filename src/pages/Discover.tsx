import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CategoryGlyph } from '../components/CategoryGlyph';
import { CopyButton } from '../components/CopyButton';
import { DifficultyMeter } from '../components/DifficultyMeter';
import { Icon } from '../components/Icons';
import {
  categoryBySlug,
  categoryFor,
  libraryStats,
  relatedTopics,
  topicById,
  topicNumber,
  topics,
} from '../lib/library';
import { usePageMeta } from '../lib/meta';
import {
  collectionLabel,
  drawTopic,
  focusPresets,
  matchesCollection,
} from '../lib/selection';
import { readJSON, storageKeys, writeJSON } from '../lib/storage';
import { useProgress } from '../providers/ProgressProvider';
import { useSaved } from '../providers/SavedProvider';
import { useToast } from '../providers/ToastProvider';
import type { Category, CollectionValue, DifficultyFilter, Topic } from '../types';

const difficulties: Array<DifficultyFilter> = ['Any', 'Beginner', 'Intermediate', 'Advanced'];

const featuredFields = [
  'ai-ml',
  'ai-engineering',
  'distributed-systems',
  'operating-systems',
  'databases',
  'cybersecurity',
  'system-design',
  'programming-languages',
];

function isHistory(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isDifficultyFilter(value: unknown): value is DifficultyFilter {
  return value === 'Any' || value === 'Beginner' || value === 'Intermediate' || value === 'Advanced';
}

function isCollection(value: unknown): value is CollectionValue {
  if (typeof value !== 'string') return false;
  if (value.startsWith('category:')) return categoryBySlug.has(value.slice('category:'.length));
  return focusPresets.some((preset) => preset.id === value);
}

export function Discover() {
  usePageMeta(
    'Random Tech',
    'One random topic. Fifteen minutes of research. A stronger technical mind. Curated computer science topics worth understanding in the AI era.',
  );

  const { notify } = useToast();
  const navigate = useNavigate();
  const { isSaved, toggleSaved } = useSaved();
  const { isComplete } = useProgress();
  const [recentIds, setRecentIds] = useState<string[]>(() =>
    readJSON<string[]>(storageKeys.history, [], isHistory)
      .filter((id) => topicById.has(id))
      .slice(0, 20),
  );
  const [collection, setCollection] = useState<CollectionValue>(() =>
    readJSON<CollectionValue>(storageKeys.drawCollection, 'anything', isCollection),
  );
  const [difficulty, setDifficulty] = useState<DifficultyFilter>(() =>
    readJSON<DifficultyFilter>(storageKeys.drawDifficulty, 'Any', isDifficultyFilter),
  );
  // A topic is waiting from the first paint, so the draw section never duplicates
  // the hero's call to action. It is not written to history until it is drawn again.
  const [current, setCurrent] = useState<Topic | null>(() =>
    drawTopic({ collection, difficulty }),
  );
  const [tuningOpen, setTuningOpen] = useState(false);
  const [drawError, setDrawError] = useState('');
  const [revealKey, setRevealKey] = useState(0);
  const generatorRef = useRef<HTMLElement>(null);

  useEffect(() => {
    writeJSON(storageKeys.drawCollection, collection);
    writeJSON(storageKeys.drawDifficulty, difficulty);
  }, [collection, difficulty]);

  const remember = useCallback((topic: Topic) => {
    setRecentIds((previous) => {
      const next = [topic.id, ...previous.filter((id) => id !== topic.id)].slice(0, 20);
      writeJSON(storageKeys.history, next);
      return next;
    });
  }, []);

  // The pre-drawn topic counts as seen, so it is not repeated after a reload.
  useEffect(() => {
    if (current) remember(current);
    // Only on mount: later draws remember themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToGenerator = useCallback(() => {
    window.setTimeout(() => {
      generatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 30);
  }, []);

  const generate = useCallback(
    (scroll = false) => {
      const next = drawTopic({
        collection,
        difficulty,
        excludeIds: recentIds,
        currentId: current?.id,
      });
      if (!next) {
        setDrawError(
          'No topics match this combination. Try another field, a different difficulty, or reset the draw.',
        );
        return;
      }
      setDrawError('');
      setCurrent(next);
      remember(next);
      setRevealKey((key) => key + 1);
      if (scroll) scrollToGenerator();
    },
    [collection, difficulty, recentIds, current?.id, remember, scrollToGenerator],
  );

  const showTopic = useCallback(
    (topic: Topic) => {
      setCurrent(topic);
      remember(topic);
      setRevealKey((key) => key + 1);
      scrollToGenerator();
    },
    [remember, scrollToGenerator],
  );

  const handleHeroGenerate = () => {
    generate(true);
  };

  const handleSave = () => {
    if (!current) return;
    const saved = toggleSaved(current.id);
    notify(
      saved ? 'Saved for later. Find it under Saved Topics.' : 'Removed from saved topics.',
      saved ? 'success' : 'info',
    );
  };

  const startRitual = () => {
    let topic = current;
    if (!topic) {
      topic = drawTopic({
        collection,
        difficulty,
        excludeIds: recentIds,
      });
      if (!topic) {
        notify('No topics match this combination. Loosen the draw first.', 'error');
        return;
      }
      setCurrent(topic);
      remember(topic);
    }
    navigate(`/research/${topic.id}`);
  };

  const resetDraw = () => {
    setCollection('anything');
    setDifficulty('Any');
    setDrawError('');
  };

  const activeFilters = (collection !== 'anything' ? 1 : 0) + (difficulty !== 'Any' ? 1 : 0);
  const currentCategory = current ? categoryFor(current) : undefined;
  const currentSaved = current ? isSaved(current.id) : false;
  const related = current ? relatedTopics(current, 3) : [];
  const matchCount = topics.filter(
    (topic) =>
      matchesCollection(topic, collection) && (difficulty === 'Any' || topic.difficulty === difficulty),
  ).length;

  const recentTopics = recentIds
    .filter((id) => id !== current?.id)
    .slice(0, 3)
    .map((id) => topicById.get(id))
    .filter((topic): topic is Topic => Boolean(topic));

  const featured = featuredFields
    .map((slug) => categoryBySlug.get(slug))
    .filter((category): category is Category => Boolean(category));

  return (
    <>
      <p className="sr-only" role="status" aria-live="polite">
        {current ? `New topic: ${current.title}` : ''}
      </p>

      <section className="hero container">
        <div className="hero-copy">
          <p className="eyebrow hero-eyebrow">
            <span className="pulse-dot" aria-hidden="true" />
            Your next 15 minutes start here
          </p>
          <h1 className="hero-title">
            Discover
            <br />
            <span className="hero-emphasis">
              What Matters.
              <svg className="hero-underline" viewBox="0 0 320 18" preserveAspectRatio="none" aria-hidden="true">
                <path d="M4 12.5C78 4.5 216 4.5 316 10.5" />
              </svg>
            </span>
          </h1>
          <p className="hero-lede">
            One random topic. Fifteen minutes of research. A stronger technical mind.
          </p>
          <p className="hero-support">
            Curated for computer science students who want the ideas behind modern systems —
            not another infinite feed.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn btn--primary btn--lg" onClick={handleHeroGenerate}>
              <Icon name="shuffle" size={19} />
              Generate a Topic
              <Icon name="arrowUpRight" size={17} className="btn-arrow" />
            </button>
            <Link to="/explore" className="btn btn--clay btn--lg">
              <Icon name="layers" size={18} />
              Explore the library
            </Link>
          </div>
          <div className="hero-meta">
            <span>
              <strong>{libraryStats.topics}</strong> curated topics
            </span>
            <span className="hero-meta__dot" aria-hidden="true" />
            <span>
              <strong>{libraryStats.categories}</strong> fields
            </span>
            <span className="hero-meta__dot" aria-hidden="true" />
            <span>No account needed</span>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="art-halo" />
          <div className="art-stage">
            <div className="art-panel">
              <svg className="art-lines" viewBox="0 0 420 420" fill="none" aria-hidden="true">
                <path d="M34 40C108 96 174 160 210 210" />
                <path d="M386 62C302 120 246 170 210 210" />
                <path d="M36 300C110 265 174 236 210 210" />
                <path d="M384 318C302 270 246 236 210 210" />
                <circle cx="34" cy="40" r="3.4" />
                <circle cx="386" cy="62" r="3.4" />
                <circle cx="36" cy="300" r="3.4" />
                <circle cx="384" cy="318" r="3.4" />
              </svg>
              <span className="art-orbit art-orbit--one" />
              <span className="art-orbit art-orbit--two" />
              <div className="art-core">
                <span className="art-core__tile art-core__tile--mint" />
                <span className="art-core__tile art-core__tile--peach" />
                <span className="art-core__tile art-core__tile--blue" />
                <span className="art-core__tile art-core__tile--ink">
                  <span />
                </span>
              </div>
            </div>

            <div className="art-node art-node--one">
              <span className="art-node__glyph glyph--lavender">
                <Icon name="network" size={19} />
              </span>
              <span>Consensus</span>
            </div>
            <div className="art-node art-node--two">
              <span className="art-node__glyph glyph--mint">
                <Icon name="search" size={19} />
              </span>
              <span>Retrieval</span>
            </div>
            <div className="art-node art-node--three">
              <span className="art-node__glyph glyph--peach">
                <Icon name="cpu" size={19} />
              </span>
              <span>Cache</span>
            </div>
            <div className="art-node art-node--four">
              <span className="art-node__glyph glyph--blue">
                <Icon name="brackets" size={19} />
              </span>
              <span>Types</span>
            </div>

            <div className="art-ticket">
              <span className="art-ticket__top">
                <Icon name="timer" size={13} /> 15 MIN
              </span>
              <span className="art-ticket__bottom">One powerful idea</span>
            </div>
            <span className="art-sphere art-sphere--peach" />
            <span className="art-sphere art-sphere--mint" />
            <span className="art-sphere art-sphere--lavender" />
          </div>
          <p className="art-caption">
            <span className="art-caption__line" />
            Every draw sits on a larger map.
          </p>
        </div>
      </section>

      <section className="generator-section container" id="generate" ref={generatorRef} aria-labelledby="draw-heading">
        <div className="generator-heading">
          <div>
            <p className="eyebrow">
              <Icon name="sparkSmall" size={13} />
              The Draw
            </p>
            <h2 id="draw-heading">One topic worth your attention.</h2>
          </div>
          <div className="generator-controls">
            <span className="draw-count">
              <span className="status-dot" aria-hidden="true" />
              {matchCount} topics in this draw
            </span>
            <button
              type="button"
              className={`btn btn--soft btn--sm tune-trigger${tuningOpen ? ' is-open' : ''}`}
              onClick={() => setTuningOpen((open) => !open)}
              aria-expanded={tuningOpen}
              aria-controls="draw-controls"
            >
              <Icon name="sliders" size={16} />
              Tune the draw
              {activeFilters > 0 && <span className="filter-count">{activeFilters}</span>}
              <Icon name={tuningOpen ? 'chevronUp' : 'chevronDown'} size={15} />
            </button>
          </div>
        </div>

        <div className="draw-stage">
          <div className="draw-side" aria-hidden="true">
            <span className="draw-side__label">CURATED / NOT CRAWLED</span>
            <span className="draw-side__rule" />
            <span className="draw-side__index">
              {current ? String(topicNumber.get(current.id) ?? 0).padStart(3, '0') : '—'}
              <span>/{libraryStats.topics}</span>
            </span>
          </div>

          <div
            className={`generator-card${current ? ' has-topic' : ' is-empty'}`}
            data-family={currentCategory?.family ?? 'lavender'}
          >
            <div className="generator-card__texture" aria-hidden="true" />

            <div className="tune-panel" id="draw-controls" hidden={!tuningOpen}>
              <div className="tune-field">
                <label htmlFor="draw-collection" className="tune-label">
                  Collection or field
                </label>
                <div className="select-wrap">
                  <select
                    id="draw-collection"
                    value={collection}
                    onChange={(event) => setCollection(event.target.value as CollectionValue)}
                  >
                    <optgroup label="Collections">
                      {focusPresets.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Fields">
                      {[...categoryBySlug.values()]
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((category) => (
                          <option key={category.slug} value={`category:${category.slug}`}>
                            {category.name} ({category.count})
                          </option>
                        ))}
                    </optgroup>
                  </select>
                  <Icon name="chevronDown" size={16} />
                </div>
              </div>

              <fieldset className="tune-field">
                <legend className="tune-label">Difficulty</legend>
                <div className="segmented">
                  {difficulties.map((level) => (
                    <button
                      key={level}
                      type="button"
                      className={`segmented__item${difficulty === level ? ' is-active' : ''}`}
                      aria-pressed={difficulty === level}
                      onClick={() => setDifficulty(level)}
                    >
                      {level === 'Any' ? 'Any level' : level}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="tune-footer">
                <p>
                  {collection === 'anything'
                    ? 'Balanced across all fields.'
                    : collectionLabel(collection)}
                  {difficulty !== 'Any' ? ` · ${difficulty}` : ' · All difficulties'}
                </p>
                {activeFilters > 0 && (
                  <button type="button" className="text-action" onClick={resetDraw}>
                    <Icon name="rotate" size={14} /> Reset filters
                  </button>
                )}
              </div>
            </div>

            {drawError && (
              <div className="draw-error" role="alert">
                <Icon name="alert" size={17} />
                <span>{drawError}</span>
                <button type="button" className="text-action" onClick={resetDraw}>
                  Reset draw
                </button>
              </div>
            )}

            {!current ? (
              <div className="generator-empty">
                <div className="empty-orb" aria-hidden="true">
                  <span className="empty-orb__ring" />
                  <Icon name="shuffle" size={38} />
                </div>
                <p className="eyebrow">Your next rabbit hole is waiting</p>
                <h3>Generate a topic worth understanding.</h3>
                <p className="generator-empty__copy">
                  One click pulls a curated question from {libraryStats.topics} topics across{' '}
                  {libraryStats.categories} fields. No loading spinner. No AI API call. Just a
                  better next fifteen minutes.
                </p>
                <button type="button" className="btn btn--primary btn--lg" onClick={() => generate(false)}>
                  <Icon name="spark" size={19} />
                  Generate a Topic
                  <Icon name="arrowUpRight" size={17} />
                </button>
                <p className="generator-empty__hint">
                  <Icon name="info" size={14} /> Recently drawn topics are skipped automatically.
                </p>
              </div>
            ) : (
              <div className="topic-reveal" key={revealKey}>
                <div className="generated-top">
                  <span className="category-chip" data-family={currentCategory?.family ?? 'lavender'}>
                    <CategoryGlyph category={currentCategory} size="sm" />
                    {current.category}
                  </span>
                  <span className="generated-top__label">Human-reviewed · Evergreen</span>
                </div>

                <div className="generated-main">
                  <div className="generated-copy">
                    <h3 className="generated-title">{current.title}</h3>
                    <p className="generated-summary">{current.summary}</p>

                    <div className="generated-meta">
                      <DifficultyMeter difficulty={current.difficulty} />
                      <span className="meta-sep" aria-hidden="true" />
                      <span className="meta-pill">
                        <Icon name="clock" size={14} /> {current.estimatedMinutes} minutes
                      </span>
                      <span className="meta-pill">
                        <Icon name="target" size={14} />
                        {current.aiRelevance ? 'AI-era relevant' : 'Durable relevance'}
                      </span>
                      {current.emerging && <span className="micro-badge">Emerging area</span>}
                      {isComplete(current.id) && (
                        <span className="micro-badge micro-badge--mint">
                          <Icon name="check" size={12} /> Completed
                        </span>
                      )}
                    </div>

                    <div className="why-block">
                      <span className="why-block__label">
                        <Icon name="bulb" size={14} /> Why it matters
                      </span>
                      <p>{current.whyItMatters}</p>
                    </div>

                    <div className="generated-actions">
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() => generate(false)}
                      >
                        <Icon name="shuffle" size={17} />
                        Generate Another
                      </button>
                      <CopyButton
                        text={current.title}
                        label="Copy Topic"
                        className="btn btn--clay"
                        toastMessage="Topic copied to your clipboard."
                      />
                      <button
                        type="button"
                        className={`btn btn--ghost save-btn${currentSaved ? ' is-saved' : ''}`}
                        onClick={handleSave}
                        aria-pressed={currentSaved}
                      >
                        <Icon name={currentSaved ? 'bookmarkFilled' : 'bookmark'} size={17} />
                        {currentSaved ? 'Saved' : 'Save Topic'}
                      </button>
                    </div>

                    <div className="generated-subactions">
                      <Link to={`/research/${current.id}`} className="text-action">
                        <Icon name="timer" size={15} /> Start the guided 15-minute session
                      </Link>
                      <CopyButton
                        text={`${current.title}\n\nResearch question: ${current.researchQuestion}`}
                        label="Copy with research question"
                        copiedLabel="Copied with question"
                        className="text-action copy-question"
                        toastMessage="Topic and research question copied."
                        iconOnly={false}
                      />
                      <Link to={`/explore?topic=${current.id}`} className="text-action">
                        <Icon name="info" size={15} /> Full brief
                      </Link>
                    </div>
                  </div>

                  <aside className="generated-aside" aria-label="Topic at a glance">
                    <div className="aside-seal" aria-hidden="true">
                      <span className="aside-seal__time">15:00</span>
                      <span className="aside-seal__label">ONE IDEA</span>
                    </div>
                    <div className="aside-block">
                      <span className="aside-label">Research question</span>
                      <p>{current.researchQuestion}</p>
                    </div>
                    <div className="aside-block">
                      <span className="aside-label">Field</span>
                      <p>
                        {current.category}
                        <span className="aside-sub">{current.subcategories.join(' · ')}</span>
                      </p>
                    </div>
                    <div className="aside-tags">
                      {current.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </aside>
                </div>

                {related.length > 0 && (
                  <div className="generated-related">
                    <span className="generated-related__label">Follow the thread</span>
                    <div className="generated-related__list">
                      {related.map((topic) => (
                        <button
                          key={topic.id}
                          type="button"
                          className="thread-chip"
                          onClick={() => showTopic(topic)}
                        >
                          <span>{topic.title}</span>
                          <Icon name="arrowUpRight" size={14} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="draw-side draw-side--right" aria-hidden="true">
            <span className="draw-side__label">RANDOM TECH / 001</span>
            <span className="draw-side__rule" />
            <span className="draw-side__mark">
              <Icon name="spark" size={17} />
            </span>
          </div>
        </div>

        <aside className="curation-strip" aria-label="How the library is curated">
          <span className="curation-strip__icon" aria-hidden="true">
            <Icon name="shield" size={17} />
          </span>
          <p>
            <strong>Reviewed, not generated.</strong> Every question is written and checked against
            ten editorial rules. No crawler, no AI call, no duplicated filler.
          </p>
          <div className="curation-strip__facts">
            <span>
              <Icon name="check" size={12} /> Human-reviewed
            </span>
            <span>
              <Icon name="listCheck" size={12} /> 10 rules
            </span>
            <span>
              <Icon name="package" size={12} /> Versioned batches
            </span>
          </div>
          <Link to="/standard" className="curation-strip__link">
            Read the standard <Icon name="arrowRight" size={14} />
          </Link>
        </aside>

        {recentTopics.length > 0 && (
          <div className="recent-draws">
            <span className="recent-draws__label">Recently drawn</span>
            <div className="recent-draws__list">
              {recentTopics.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  className="recent-chip"
                  onClick={() => showTopic(topic)}
                >
                  <span className="recent-chip__dot" aria-hidden="true" />
                  {topic.title}
                </button>
              ))}
            </div>
            <span className="recent-draws__hint">Not repeated until the pool is fresh</span>
          </div>
        )}
      </section>

      <section className="ritual-section container" aria-labelledby="ritual-heading">
        <div className="ritual-card">
          <div className="ritual-intro">
            <p className="eyebrow">
              <Icon name="timer" size={13} />
              The ritual
            </p>
            <h2 id="ritual-heading">Fifteen minutes. One powerful idea.</h2>
            <p>
              The internet rewards you for scrolling. This is the opposite: read the brief, keep
              your sources, answer the research question, and save one takeaway.
            </p>
            <button type="button" className="btn btn--primary" onClick={startRitual}>
              <Icon name="play" size={16} />
              Start a session
            </button>
            <span className="ritual-footnote">
              Optional timer. No sign-up. Leave whenever you like.
            </span>
          </div>
          <ol className="ritual-steps">
            <li className="ritual-step">
              <span className="ritual-step__number">01</span>
              <span className="ritual-step__glyph">
                <Icon name="spark" size={20} />
              </span>
              <h3>Draw a question</h3>
              <p>Press once. Receive one topic chosen for value, not popularity.</p>
            </li>
            <li className="ritual-step">
              <span className="ritual-step__number">02</span>
              <span className="ritual-step__glyph">
                <Icon name="search" size={20} />
              </span>
              <h3>Research the mechanism</h3>
              <p>Keep the sources you use. Define the mechanism, then find one limitation or trade-off.</p>
            </li>
            <li className="ritual-step">
              <span className="ritual-step__number">03</span>
              <span className="ritual-step__glyph">
                <Icon name="chat" size={20} />
              </span>
              <h3>Answer, then keep it</h3>
              <p>Close the tabs. Answer the question in your own words and save one takeaway.</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="field-section container" aria-labelledby="fields-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              <Icon name="layers" size={13} />
              The map
            </p>
            <h2 id="fields-heading">Browse by field.</h2>
          </div>
          <Link to="/explore" className="btn btn--soft btn--sm">
            All {libraryStats.categories} fields
            <Icon name="arrowUpRight" size={15} />
          </Link>
        </div>
        <div className="field-grid">
          {featured.map((category) => (
            <Link
              key={category.slug}
              to={`/explore?category=${category.slug}`}
              className="field-tile"
              data-family={category.family}
            >
              <CategoryGlyph category={category} size="md" />
              <span className="field-tile__name">{category.name}</span>
              <span className="field-tile__count">{category.count} topics</span>
              <Icon name="arrowUpRight" size={16} className="field-tile__arrow" />
            </Link>
          ))}
        </div>
        <div className="map-note">
          <span className="map-note__icon">
            <Icon name="spark" size={18} />
          </span>
          <p>
            <strong>{libraryStats.topics} topics</strong> across algorithms, systems, AI, security,
            languages, product, and the physical layer. Every entry is reviewed for durable
            technical value.
          </p>
          <Link to="/explore" className="text-action">
            Open the library <Icon name="arrowRight" size={15} />
          </Link>
        </div>
      </section>
    </>
  );
}

