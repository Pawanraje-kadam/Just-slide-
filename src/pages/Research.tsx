import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CategoryGlyph } from '../components/CategoryGlyph';
import { CopyButton } from '../components/CopyButton';
import { DifficultyMeter } from '../components/DifficultyMeter';
import { Icon } from '../components/Icons';
import { categoryFor, topicById } from '../lib/library';
import { usePageMeta } from '../lib/meta';
import {
  RESEARCH_MOVES,
  TOTAL_SECONDS,
  formatTime,
  loadDraft,
  makeSourceId,
  parseSource,
  saveDraft,
  sourceKey,
  spokenTime,
} from '../lib/ritual';
import { useProgress } from '../providers/ProgressProvider';
import { useSaved } from '../providers/SavedProvider';
import { useToast } from '../providers/ToastProvider';
import type { RitualDraft, RitualSource, Topic } from '../types';

const MIN_ANSWER = 40;
const MIN_TAKEAWAY = 40;

const prompts = [
  'What did you learn?',
  'Why does this concept matter?',
  'What remains unclear?',
  'Where might you use this knowledge?',
];

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
  const { markComplete } = useProgress();

  const [draft, setDraft] = useState<RitualDraft>(() => {
    const loaded = loadDraft(topic.id);
    const savedNote = getNote(topic.id);
    if (!loaded.learned && savedNote?.text) return { ...loaded, learned: savedNote.text };
    return loaded;
  });
  const [remaining, setRemaining] = useState(draft.remaining);
  const [running, setRunning] = useState(Boolean(draft.endAt));
  const [sourceInput, setSourceInput] = useState('');
  const endAt = useRef<number | null>(draft.endAt);
  const remainingRef = useRef(draft.remaining);
  const draftRef = useRef(draft);
  const completionRef = useRef<HTMLDivElement>(null);
  draftRef.current = draft;

  // Autosave everything the reader writes, including a timer that is still running.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveDraft(topic.id, { ...draft, remaining: remainingRef.current, endAt: endAt.current });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [draft, topic.id]);

  useEffect(
    () => () => {
      saveDraft(topic.id, {
        ...draftRef.current,
        remaining: remainingRef.current,
        endAt: endAt.current,
      });
    },
    [topic.id],
  );

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const next = Math.max(0, Math.ceil(((endAt.current ?? Date.now()) - Date.now()) / 1000));
      remainingRef.current = next;
      setRemaining(next);
      if (next === 0) {
        setRunning(false);
        endAt.current = null;
        setDraft((current) => ({ ...current, remaining: 0, endAt: null }));
      }
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [running]);

  const start = () => {
    const next = remaining === 0 ? TOTAL_SECONDS : remaining;
    remainingRef.current = next;
    endAt.current = Date.now() + next * 1000;
    setRemaining(next);
    setRunning(true);
    setDraft((current) => ({ ...current, started: true, remaining: next, endAt: endAt.current }));
  };

  const pause = () => {
    const next = endAt.current
      ? Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000))
      : remaining;
    remainingRef.current = next;
    setRemaining(next);
    setRunning(false);
    endAt.current = null;
    setDraft((current) => ({ ...current, remaining: next, endAt: null }));
  };

  const reset = () => {
    remainingRef.current = TOTAL_SECONDS;
    endAt.current = null;
    setRemaining(TOTAL_SECONDS);
    setRunning(false);
    setDraft((current) => ({
      ...current,
      remaining: TOTAL_SECONDS,
      started: false,
      endAt: null,
    }));
  };

  const addSource = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = parseSource(sourceInput);
    if (!parsed.label) return;
    if (draft.sources.some((source) => sourceKey(source) === sourceKey(parsed))) {
      notify('That source is already on your list.', 'info');
      return;
    }
    const source: RitualSource = {
      id: makeSourceId(),
      label: parsed.label,
      ...(parsed.url ? { url: parsed.url } : {}),
      addedAt: new Date().toISOString(),
    };
    setDraft((current) => ({ ...current, sources: [...current.sources, source] }));
    setSourceInput('');
  };

  const removeSource = (id: string) => {
    setDraft((current) => ({
      ...current,
      sources: current.sources.filter((source) => source.id !== id),
    }));
  };

  const toggleCheck = (index: number) => {
    setDraft((current) => ({
      ...current,
      checked: current.checked.map((value, i) => (i === index ? !value : value)),
    }));
  };

  const answerReady = draft.answer.trim().length >= MIN_ANSWER;
  const learnedReady = draft.learned.trim().length >= MIN_TAKEAWAY;
  const checkedCount = draft.checked.filter(Boolean).length;
  const researchReady = draft.sources.length > 0 || checkedCount >= 3;
  const complete = Boolean(draft.completedAt);

  const finishSession = () => {
    if (!answerReady || !learnedReady) {
      notify('Add a short answer and one takeaway before closing the session.', 'info');
      return;
    }
    const spent = draft.started ? Math.max(0, TOTAL_SECONDS - Math.min(remaining, TOTAL_SECONDS)) : 0;
    const finished: RitualDraft = {
      ...draft,
      answer: draft.answer.trim(),
      learned: draft.learned.trim(),
      completedAt: new Date().toISOString(),
      spentSeconds: spent,
      remaining,
      endAt: null,
    };
    endAt.current = null;
    setRunning(false);
    setDraft(finished);
    saveDraft(topic.id, finished);
    saveNote(topic.id, finished.learned);
    if (!isSaved(topic.id)) toggleSaved(topic.id);
    markComplete(topic.id);
    notify('Session saved. Your answer, sources, and reflection stay in this browser.', 'success');
    window.setTimeout(() => {
      completionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

  const steps = useMemo(
    () => [
      { id: 'step-brief', label: 'Read the brief', done: true, target: 'step-brief' },
      {
        id: 'step-research',
        label: 'Research + sources',
        done: researchReady,
        target: 'step-research',
      },
      { id: 'step-answer', label: 'Write your answer', done: answerReady, target: 'step-answer' },
      {
        id: 'step-learned',
        label: 'Keep what you learned',
        done: learnedReady || complete,
        target: 'step-learned',
      },
    ],
    [researchReady, answerReady, learnedReady, complete],
  );
  const doneCount = steps.filter((step) => step.done).length;
  const currentStep = steps.find((step) => !step.done)?.id;

  const goToStep = (target: string) => {
    const element = document.getElementById(target);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const progress = 1 - remaining / TOTAL_SECONDS;
  const circumference = 2 * Math.PI * 88;
  const minutesLeft = Math.ceil(remaining / 60);
  const showComplete = remaining === 0 && draft.started;
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
          {complete && (
            <span className="micro-badge micro-badge--mint">
              <Icon name="check" size={12} /> Session complete
            </span>
          )}
        </div>
      </header>

      <div className="ritual-layout">
        <article className="ritual-main">
          <section id="step-brief" className="ritual-step-block" aria-labelledby="brief-heading">
            <div className="ritual-step-block__head">
              <span className={`step-index${currentStep === 'step-brief' ? ' is-current' : ''}`}>
                01
              </span>
              <div>
                <h2 id="brief-heading">Read the brief</h2>
                <p>Get the shape of the idea. You do not need to understand it yet.</p>
              </div>
            </div>

            <p className="ritual-summary">{topic.summary}</p>

            <div className="detail-block detail-block--why">
              <span className="detail-label">
                <Icon name="bulb" size={14} /> Why it matters
              </span>
              <p>{topic.whyItMatters}</p>
            </div>

            <div className="research-question">
              <span className="research-question__icon" aria-hidden="true">
                <Icon name="search" size={22} />
              </span>
              <div>
                <h3 id="research-question-label">Your research question</h3>
                <p>{topic.researchQuestion}</p>
                <CopyButton
                  text={topic.researchQuestion}
                  label="Copy question"
                  copiedLabel="Question copied"
                  className="text-action copy-question"
                  toastMessage="Research question copied."
                />
              </div>
            </div>
          </section>

          <section id="step-research" className="ritual-step-block" aria-labelledby="research-heading">
            <div className="ritual-step-block__head">
              <span className={`step-index${currentStep === 'step-research' ? ' is-current' : ''}`}>
                02
              </span>
              <div>
                <h2 id="research-heading">Research and capture sources</h2>
                <p>
                  Keep the links you actually use. They stay with this session in your browser.
                </p>
              </div>
            </div>

            <form className="source-form" onSubmit={addSource}>
              <label htmlFor="source-input" className="sr-only">
                Add a source link or reference
              </label>
              <span className="source-form__icon" aria-hidden="true">
                <Icon name="link" size={17} />
              </span>
              <input
                id="source-input"
                type="text"
                value={sourceInput}
                onChange={(event) => setSourceInput(event.target.value)}
                placeholder="Paste a link, or note a book, paper, or talk…"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="submit"
                className="btn btn--soft btn--sm source-form__submit"
                disabled={!sourceInput.trim()}
                aria-label="Add source"
              >
                <Icon name="plus" size={15} />
                <span>Add source</span>
              </button>
            </form>

            {draft.sources.length === 0 ? (
              <p className="sources-empty">
                <Icon name="info" size={14} /> Start with primary material: documentation, a paper,
                or a specification. Then compare one second explanation.
              </p>
            ) : (
              <ul className="source-list" aria-label="Sources for this session">
                {draft.sources.map((source) => (
                  <li key={source.id} className="source-row">
                    <span className="source-row__icon" aria-hidden="true">
                      <Icon name={source.url ? 'link' : 'flag'} size={15} />
                    </span>
                    <span className="source-row__main">
                      {source.url ? (
                        <a href={source.url} target="_blank" rel="noreferrer noopener">
                          {source.label}
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      ) : (
                        source.label
                      )}
                    </span>
                    <button
                      type="button"
                      className="icon-btn source-row__remove"
                      onClick={() => removeSource(source.id)}
                      aria-label={`Remove source ${source.label}`}
                    >
                      <Icon name="close" size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="research-moves">
              <div className="research-moves__head">
                <h3>Research moves</h3>
                <span>
                  {checkedCount}/{RESEARCH_MOVES.length}
                </span>
              </div>
              <ul className="checklist">
                {RESEARCH_MOVES.map((check, index) => (
                  <li key={check}>
                    <label className={`check-row${draft.checked[index] ? ' is-checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={draft.checked[index] ?? false}
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
            </div>
          </section>

          <section id="step-answer" className="ritual-step-block" aria-labelledby="answer-heading">
            <div className="ritual-step-block__head">
              <span className={`step-index${currentStep === 'step-answer' ? ' is-current' : ''}`}>
                03
              </span>
              <div>
                <h2 id="answer-heading">Write your answer</h2>
                <p>Three to five sentences, in your own words. This is not an essay.</p>
              </div>
            </div>

            <label htmlFor="ritual-answer" className="ritual-field-label">
              Answer this: {topic.researchQuestion}
            </label>
            <textarea
              id="ritual-answer"
              className="ritual-textarea"
              rows={5}
              value={draft.answer}
              onChange={(event) =>
                setDraft((current) => ({ ...current, answer: event.target.value }))
              }
              placeholder="The mechanism is… It matters because…"
              aria-describedby="answer-hint"
            />
            <p id="answer-hint" className="field-hint">
              {answerReady
                ? 'Answer drafted. You can refine it after the timer.'
                : `Aim for a real explanation — at least ${MIN_ANSWER} characters.`}
            </p>
          </section>

          <section id="step-learned" className="ritual-step-block" aria-labelledby="learned-heading">
            <div className="ritual-step-block__head">
              <span className={`step-index${currentStep === 'step-learned' ? ' is-current' : ''}`}>
                04
              </span>
              <div>
                <h2 id="learned-heading">Keep what you learned</h2>
                <p>The one idea worth carrying into your next project.</p>
              </div>
            </div>

            <label htmlFor="ritual-learned" className="ritual-field-label">
              What I learned
            </label>
            <textarea
              id="ritual-learned"
              className="ritual-textarea"
              rows={5}
              value={draft.learned}
              onChange={(event) =>
                setDraft((current) => ({ ...current, learned: event.target.value }))
              }
              placeholder="In my own words, this matters because…"
              aria-describedby="learned-hint"
            />
            <p id="learned-hint" className="field-hint">
              Saved as your note on this topic. If you are stuck:
            </p>
            <ul className="reflection-prompts">
              {prompts.map((prompt) => (
                <li key={prompt}>{prompt}</li>
              ))}
            </ul>

            <div className="session-finish">
              <div>
                <h3>{complete ? 'Session saved' : 'Close the loop'}</h3>
                <p>
                  {complete
                    ? 'Your answer, sources, and takeaway are on your shelf.'
                    : 'Finishing saves your takeaway to your shelf and records the session. The timer is optional.'}
                </p>
              </div>
              <button type="button" className="btn btn--primary" onClick={finishSession}>
                <Icon name={complete ? 'rotate' : 'check'} size={16} />
                {complete ? 'Update saved session' : 'Finish and save session'}
              </button>
            </div>

            {complete && (
              <div className="session-complete" ref={completionRef}>
                <span className="session-complete__icon" aria-hidden="true">
                  <Icon name="check" size={20} />
                </span>
                <div>
                  <p className="eyebrow">Session complete</p>
                  <h3>You kept the part that matters.</h3>
                  <p>
                    {draft.spentSeconds > 0
                      ? `${Math.max(1, Math.round(draft.spentSeconds / 60))} focused minutes`
                      : 'No timer needed'}{' '}
                    · {draft.sources.length} {draft.sources.length === 1 ? 'source' : 'sources'} ·{' '}
                    {checkedCount} research {checkedCount === 1 ? 'move' : 'moves'}
                  </p>
                  <div className="session-complete__actions">
                    <Link to="/" className="btn btn--primary btn--sm">
                      <Icon name="shuffle" size={15} /> Draw another topic
                    </Link>
                    <Link to="/saved" className="btn btn--clay btn--sm">
                      <Icon name="bookmark" size={15} /> Open your shelf
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <p className="reflection-note">
              <Icon name="info" size={13} /> Notes stay in this browser. No account, no upload.
            </p>
          </section>
        </article>

        <aside className="timer-column" aria-label="Research tools">
          <div className="timer-sticky">
            <div
              id="timer-card"
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
                <span
                  className="timer-value"
                  role="timer"
                  aria-label={`${spokenTime(remaining)} remaining`}
                >
                  {formatTime(remaining)}
                </span>
                <span className="timer-label">
                  {showComplete ? 'Time is up' : running ? 'Focused' : draft.started ? 'Paused' : 'Ready'}
                </span>
              </div>
            </div>
            <p className="sr-only" aria-live="polite">
              {running
                ? `${minutesLeft} minutes remaining`
                : showComplete
                  ? 'Fifteen minutes complete'
                  : draft.started
                    ? 'Timer paused'
                    : 'Timer ready'}
            </p>
            <div className="timer-actions">
              {!running ? (
                <button type="button" className="btn btn--primary btn--sm" onClick={start}>
                  <Icon name="play" size={15} />
                  {remaining === 0 ? 'Start again' : draft.started ? 'Resume' : 'Start timer'}
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

          <nav className="ritual-rail" aria-label="Session steps">
            <div className="ritual-rail__head">
              <h2>Your session</h2>
              <span>
                {doneCount}/{steps.length}
              </span>
            </div>
            <ol className="ritual-rail__list">
              {steps.map((step, index) => (
                <li key={step.id}>
                  <button
                    type="button"
                    className={`rail-step${step.done ? ' is-done' : ''}${
                      currentStep === step.id ? ' is-current' : ''
                    }`}
                    onClick={() => goToStep(step.target)}
                    aria-current={currentStep === step.id ? 'step' : undefined}
                  >
                    <span className="rail-step__index" aria-hidden="true">
                      {step.done ? <Icon name="check" size={12} /> : `0${index + 1}`}
                    </span>
                    <span className="rail-step__label">{step.label}</span>
                    <span className="sr-only">
                      {step.done ? ' (complete)' : currentStep === step.id ? ' (current step)' : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
              <p className="ritual-rail__foot">
                <Icon name="info" size={13} /> Everything autosaves in this browser.
              </p>
            </nav>
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
