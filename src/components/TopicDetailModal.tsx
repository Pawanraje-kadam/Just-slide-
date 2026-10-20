import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { categoryFor, relatedTopics, topicNumber } from '../lib/library';
import { useProgress } from '../providers/ProgressProvider';
import { useSaved } from '../providers/SavedProvider';
import { useToast } from '../providers/ToastProvider';
import type { Topic } from '../types';
import { CategoryGlyph } from './CategoryGlyph';
import { CopyButton } from './CopyButton';
import { DifficultyMeter } from './DifficultyMeter';
import { Icon } from './Icons';

interface TopicDetailModalProps {
  topic: Topic | null;
  onClose: () => void;
  onSelectTopic: (topic: Topic) => void;
}

export function TopicDetailModal({ topic, onClose, onSelectTopic }: TopicDetailModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const { isSaved, toggleSaved, getNote } = useSaved();
  const { isComplete } = useProgress();
  const { notify } = useToast();
  const open = Boolean(topic);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const appRoot = document.getElementById('root');
    const rootWasInert = appRoot?.hasAttribute('inert') ?? false;
    appRoot?.setAttribute('inert', '');
    const focusTimer = window.setTimeout(() => {
      dialogRef.current?.focus();
    }, 20);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (!rootWasInert) appRoot?.removeAttribute('inert');
      returnFocusRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!topic || !dialogRef.current) return;
    dialogRef.current.scrollTop = 0;
  }, [topic?.id]);

  if (!topic) return null;

  const category = categoryFor(topic);
  const saved = isSaved(topic.id);
  const note = getNote(topic.id);
  const related = relatedTopics(topic, 3);
  const number = topicNumber.get(topic.id) ?? 0;

  const handleSave = () => {
    const nowSaved = toggleSaved(topic.id);
    notify(
      nowSaved ? 'Saved for later. Find it under Saved Topics.' : 'Removed from saved topics.',
      nowSaved ? 'success' : 'info',
    );
  };

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="topic-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="topic-modal-title"
        tabIndex={-1}
        data-family={category?.family ?? 'lavender'}
      >
        <div className="topic-modal__header">
          <div className="topic-modal__crumb">
            <CategoryGlyph category={category} size="sm" />
            <span>{category?.name ?? topic.category}</span>
            <span className="crumb-sep" aria-hidden="true">/</span>
            <span className="mono-label">No. {String(number).padStart(3, '0')}</span>
          </div>
          <button type="button" className="icon-btn modal-close" onClick={onClose} aria-label="Close topic details">
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="topic-modal__scroll">
          <div className="topic-modal__meta">
            <DifficultyMeter difficulty={topic.difficulty} />
            <span className="meta-sep" aria-hidden="true" />
            <span className="time-chip">
              <Icon name="clock" size={14} />
              {topic.estimatedMinutes} minutes
            </span>
            {topic.aiRelevance && <span className="micro-badge">AI-era relevant</span>}
            {topic.emerging && <span className="micro-badge micro-badge--mint">Emerging area</span>}
            {isComplete(topic.id) && (
              <span className="micro-badge micro-badge--mint">
                <Icon name="check" size={12} /> Completed
              </span>
            )}
          </div>

          <h2 id="topic-modal-title" className="topic-modal__title">
            {topic.title}
          </h2>
          <p className="topic-modal__summary">{topic.summary}</p>

          <div className="detail-block detail-block--why">
            <span className="detail-label">
              <Icon name="bulb" size={14} /> Why it matters
            </span>
            <p>{topic.whyItMatters}</p>
          </div>

          <div className="detail-block detail-block--question">
            <span className="detail-label">
              <Icon name="search" size={14} /> Research question
            </span>
            <p>{topic.researchQuestion}</p>
            <CopyButton
              text={`${topic.title}\n\nResearch question: ${topic.researchQuestion}`}
              label="Copy with research question"
              copiedLabel="Copied with question"
              className="text-action copy-question"
              toastMessage="Topic and research question copied."
            />
          </div>

          <div className="detail-split">
            <div className="detail-block">
              <span className="detail-label">Helpful background</span>
              <p>{category?.foundation ?? 'A basic understanding of the field.'}</p>
            </div>
            <div className="detail-block">
              <span className="detail-label">Fields it touches</span>
              <p>{[topic.category, ...topic.subcategories].join(' · ')}</p>
            </div>
          </div>

          {note && (
            <div className="detail-block detail-block--note">
              <span className="detail-label">
                <Icon name="bookmark" size={14} /> Your note
              </span>
              <p>{note.text}</p>
            </div>
          )}

          <div className="tag-row" aria-label="Topic tags">
            {topic.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>

          <div className="related-block">
            <div className="related-heading">
              <h3>Follow the thread</h3>
              <span>Related by field and tags</span>
            </div>
            <div className="related-list">
              {related.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className="related-item"
                  onClick={() => onSelectTopic(entry)}
                >
                  <CategoryGlyph category={categoryFor(entry)} size="sm" />
                  <span className="related-item__text">
                    <span>{entry.title}</span>
                    <span className="related-item__meta">
                      {entry.category} · {entry.difficulty}
                    </span>
                  </span>
                  <Icon name="arrowUpRight" size={16} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="topic-modal__actions">
          <CopyButton
            text={topic.title}
            label="Copy topic"
            className="btn btn--soft btn--sm"
            toastMessage="Topic copied to your clipboard."
          />
          <Link to={`/research/${topic.id}`} className="btn btn--primary btn--sm">
            <Icon name="timer" size={16} />
            Start 15-minute ritual
          </Link>
          <button
            type="button"
            className={`btn btn--ghost btn--sm save-btn${saved ? ' is-saved' : ''}`}
            onClick={handleSave}
            aria-pressed={saved}
          >
            <Icon name={saved ? 'bookmarkFilled' : 'bookmark'} size={16} />
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
