import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CategoryGlyph } from '../components/CategoryGlyph';
import { CopyButton } from '../components/CopyButton';
import { DifficultyMeter } from '../components/DifficultyMeter';
import { Icon } from '../components/Icons';
import { categoryFor, topicById } from '../lib/library';
import { usePageMeta } from '../lib/meta';
import { readJSON, storageKeys, writeJSON } from '../lib/storage';
import { useSaved } from '../providers/SavedProvider';
import { useToast } from '../providers/ToastProvider';
import type { Topic } from '../types';

const TOTAL_SECONDS = 15 * 60;
const checks = [
  'Define the concept in your own words.',
  'Understand how it actually works.',
  'Identify one practical application.',
  'Discover one limitation or trade-off.',
  'Explain what you learned without your notes.',
];

const prompts = [
  'What did you learn?',
  'Why does this concept matter?',
  'What remains unclear?',
  'Where might you use this knowledge?',
];

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

function isCheckArray(value: unknown): value is boolean[] {
  return (
    Array.isArray(value) &&
    value.length === checks.length &&
    value.every((entry) => typeof entry === 'boolean')
  );
}

export function Research() {
  const { topicId } = useParams();
  const topic = topicId ? topicById.get(topicId) : undefined;

  usePageMeta(
    topic ? topic.title : 'Topic not found',
    topic ? `Spend fifteen focused minutes on: ${topic.title}` : undefined,
  );

  if (!topic) {
    return (
      <section className="not-found container">
        <div className="not-found__card">
          <span className="not-found__glyph" aria-hidden="true">
            <Icon name="search" size={34} />
          </span>
          <p className="eyebrow">Topic not found</p>
          <h1>That question has wandered off.</h1>
          <p>The topic may have been removed or the link may be incomplete.</p>
          <Link to="/" className="btn btn--primary">
            <Icon name="spark" size={17} /> Draw a new topic
          </Link>
        </div>
      </section>
    );
  }

  return <RitualSession key={topic.id} topic={topic} />;
}

function RitualSession({ topic }: { topic: Topic }) {
  const category = categoryFor(topic);
  const { notify } = useToast();
  const { getNote, saveNote, isSaved, toggleSaved } = useSaved();

  const [remaining, setRemaining] = useState(TOTAL_SECONDS);
  const [running, setRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [complete, setComplete] = useState(false);
  const [checked, setChecked] = useState<boolean[]>(() =>
    readJSON<boolean[]>(storageKeys.checklist(topic.id), checks.map(() => false), isCheckArray),
  );
  const [reflection, setReflection] = useState(() => getNote(topic.id)?.text ?? '');
  const endAt = useRef<number | null>(null);
  const reflectionRef = useRef<HTMLElement>(null);
  const savedNote = getNote(topic.id);

  useEffect(() => {
    writeJSON(storageKeys.checklist(topic.id), checked);
  }, [checked, topic.id]);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const next = Math.max(0, Math.ceil(((endAt.current ?? Date.now()) - Date.now()) / 1000));
      setRemaining(next);
      if (next === 0) {
        setRunning(false);
        setComplete(true);
      }
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [running]);

  const start = () => {
    if (remaining === 0) {
      setRemaining(TOTAL_SECONDS);
      endAt.current = Date.now() + TOTAL_SECONDS * 1000;
    } else {
      endAt.current = Date.now() + remaining * 1000;
    }
    setHasStarted(true);
    setRunning(true);
  };

  const pause = () => {
    if (endAt.current) {
      setRemaining(Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000)));
    }
    setRunning(false);
  };

  const reset = () => {
    endAt.current = null;
    setRemaining(TOTAL_SECONDS);
    setRunning(false);
    setHasStarted(false);
  };

  const finish = () => {
    setComplete(true);
    setRunning(false);
    window.setTimeout(() => {
      reflectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  };

  const toggleCheck = (index: number) => {
    setChecked((current) => current.map((value, i) => (i === index ? !value : value)));
  };

  const handleSaveReflection = () => {
    const text = reflection.trim();
    if (!text) {
      notify('Write a sentence or two before saving your reflection.', 'info');
      return;
    }
    saveNote(topic.id, text);
    if (!isSaved(topic.id)) {
      toggleSaved(topic.id);
      notify('Reflection saved. Topic added to your shelf.', 'success');
    } else {
      notify('Reflection saved to this browser.', 'success');
    }
  };

  const checkedCount = checked.filter(Boolean).length;
  const showComplete = complete && !running;
  const progress = 1 - remaining / TOTAL_SECONDS;
  const circumference = 2 * Math.PI * 88;
  const minutesLeft = Math.ceil(remaining / 60);
  const relatedHref = useMemo(
    () => `/explore?topic=${encodeURIComponent(topic.id)}`,
    [topic.id],
  );

  return (
    <div className="ritual-page container">
      <div className="ritual-topbar">
        <Link to="/" className="back-link">
          <Icon name="arrowLeft" size={16} /> Back to Discover
        </Link>
        <div className="ritual-topbar__actions">
          <CopyButton
            text={topic.title}
            label="Copy topic"
            className="btn btn--soft btn--sm"
            toastMessage="Topic copied. Research it anywhere."
          />
          <Link to={relatedHref} className="btn btn--ghost btn--sm">
            Full brief <Icon name="arrowUpRight" size={15} />
          </Link>
        </div>
      </div>

      <header className="ritual-header">
        <p className="eyebrow">
          <Icon name="timer" size={13} />
          The 15-minute ritual
        </p>
        <h1>{topic.title}</h1>
        <div className="ritual-meta">
          <span className="category-chip" data-family={category?.family ?? 'lavender'}>
            <CategoryGlyph category={category} size="sm" />
            {topic.category}
          </span>
          <DifficultyMeter difficulty={topic.difficulty} />
          <span className="meta-pill">
            <Icon name="clock" size={14} /> {topic.estimatedMinutes} minutes
          </span>
          {savedNote && (
            <span className="micro-badge micro-badge--mint">
              <Icon name="check" size={12} /> Reflection saved
            </span>
          )}
        </div>
      </header>

      <div className="ritual-layout">
        <article className="ritual-main">
          <p className="ritual-summary">{topic.summary}</p>

          <div className="detail-block detail-block--why">
            <span className="detail-label">
              <Icon name="bulb" size={14} /> Why it matters
            </span>
            <p>{topic.whyItMatters}</p>
          </div>

          <section className="research-question" aria-labelledby="research-question-heading">
            <span className="research-question__icon" aria-hidden="true">
              <Icon name="search" size={22} />
            </span>
            <div>
              <h2 id="research-question-heading">Your research question</h2>
              <p>{topic.researchQuestion}</p>
            </div>
          </section>

          <section className="checklist-section" aria-labelledby="checklist-heading">
            <div className="section-heading section-heading--tight">
              <div>
                <h2 id="checklist-heading">The checklist</h2>
                <p className="section-sub">Five steps to a real understanding.</p>
              </div>
              <span className="checklist-progress">
                {checkedCount}/{checks.length}
              </span>
            </div>
            <div
              className="checklist-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={checks.length}
              aria-valuenow={checkedCount}
              aria-label="Research checklist progress"
            >
              <span style={{ width: `${(checkedCount / checks.length) * 100}%` }} />
            </div>
            <ul className="checklist">
              {checks.map((check, index) => (
                <li key={check}>
                  <label className={`check-row${checked[index] ? ' is-checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={checked[index] ?? false}
                      onChange={() => toggleCheck(index)}
                    />
                    <span className="check-box" aria-hidden="true">
                      <Icon name="check" size={13} />
                    </span>
                    <span className="check-text">{check}</span>
                    <span className="check-index" aria-hidden="true">
                      0{index + 1}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            {!complete && (
              <button type="button" className="btn btn--clay btn--sm finish-btn" onClick={finish}>
                <Icon name="check" size={16} /> I&rsquo;ve finished this session
              </button>
            )}
          </section>

          {complete && (
            <section className="reflection" ref={reflectionRef} aria-labelledby="reflection-heading">
              <div className="reflection__badge" aria-hidden="true">
                <Icon name="spark" size={22} />
              </div>
              <p className="eyebrow">Session complete</p>
              <h2 id="reflection-heading">Close the loop.</h2>
              <p className="reflection__intro">
                You gave one idea fifteen focused minutes. Before the tabs close, keep the part
                that matters: what you now understand, and what you still do not.
              </p>
              <ol className="prompt-list">
                {prompts.map((prompt) => (
                  <li key={prompt}>{prompt}</li>
                ))}
              </ol>
              <label htmlFor="reflection-note" className="reflection-label">
                Your reflection
              </label>
              <textarea
                id="reflection-note"
                className="reflection-textarea"
                rows={6}
                value={reflection}
                onChange={(event) => setReflection(event.target.value)}
                placeholder="In my own words, this is important because…"
              />
              <div className="reflection-actions">
                <button type="button" className="btn btn--primary btn--sm" onClick={handleSaveReflection}>
                  <Icon name="bookmark" size={16} /> Save reflection
                </button>
                <Link to="/" className="btn btn--ghost btn--sm">
                  Draw another topic
                  <Icon name="arrowUpRight" size={15} />
                </Link>
                <Link to={relatedHref} className="text-action">
                  Read the full brief <Icon name="arrowRight" size={14} />
                </Link>
              </div>
              <p className="reflection-note">
                <Icon name="info" size={13} /> Notes stay in this browser. No account, no upload.
              </p>
            </section>
          )}
        </article>

        <aside className="timer-column" aria-label="Research timer">
          <div
            className={`timer-card${running ? ' is-running' : ''}${showComplete ? ' is-complete' : ''}`}
          >
            <span className="timer-card__eyebrow">The fifteen</span>
            <div className="timer-ring">
              <svg viewBox="0 0 200 200" aria-hidden="true">
                <circle className="timer-ring__track" cx="100" cy="100" r="88" />
                <circle
                  className="timer-ring__progress"
                  cx="100"
                  cy="100"
                  r="88"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress)}
                />
              </svg>
              <div className="timer-ring__center">
                <span className="timer-value" aria-hidden="true">
                  {formatTime(remaining)}
                </span>
                <span className="timer-label">
                  {showComplete ? 'Session complete' : running ? 'Focused' : hasStarted ? 'Paused' : 'Ready'}
                </span>
              </div>
            </div>
            <p className="sr-only" aria-live="polite">
              {running ? `${minutesLeft} minutes remaining` : showComplete ? 'Session complete' : 'Timer paused'}
            </p>
            <div className="timer-actions">
              {!running ? (
                <button type="button" className="btn btn--primary btn--sm" onClick={start}>
                  <Icon name="play" size={15} />
                  {remaining === 0 ? 'Start again' : hasStarted ? 'Resume' : 'Start timer'}
                </button>
              ) : (
                <button type="button" className="btn btn--clay btn--sm" onClick={pause}>
                  <Icon name="pause" size={15} /> Pause
                </button>
              )}
              <button
                type="button"
                className="icon-btn timer-reset"
                onClick={reset}
                aria-label="Reset timer to fifteen minutes"
              >
                <Icon name="rotate" size={17} />
              </button>
            </div>
            <p className="timer-optional">The timer is optional. The thinking is not.</p>
          </div>

          <div className="ritual-aside">
            <span className="ritual-aside__icon">
              <Icon name="sparkSmall" size={17} />
            </span>
            <div>
              <h2>A better fifteen minutes</h2>
              <p>
                Search for the mechanism, not just the definition. Look for one thing that
                surprised you. Then explain it without looking.
              </p>
            </div>
          </div>

          <div className="ritual-aside ritual-aside--quiet">
            <span className="ritual-aside__icon">
              <Icon name="clock" size={17} />
            </span>
            <div>
              <h2>You can leave</h2>
              <p>
                Copy the topic and research it wherever you like. No registration, no streak to
                maintain.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
