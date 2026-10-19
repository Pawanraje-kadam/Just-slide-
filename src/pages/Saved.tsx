import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icons';
import { TopicDetailModal } from '../components/TopicDetailModal';
import { TopicGridCard } from '../components/TopicGridCard';
import { usePageMeta } from '../lib/meta';
import { useSaved } from '../providers/SavedProvider';
import type { Topic } from '../types';

export function Saved() {
  usePageMeta(
    'Saved topics',
    'Your personal shelf of curated computer science topics. Saved locally in your browser.',
  );

  const { savedTopics, getNote } = useSaved();
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [lastDrawn, setLastDrawn] = useState<string | null>(null);

  const drawFromSaved = () => {
    const pool = savedTopics.filter((topic) => topic.id !== lastDrawn);
    const candidates = pool.length ? pool : savedTopics;
    if (!candidates.length) return;
    const index = Math.floor(Math.random() * candidates.length);
    const topic = candidates[index];
    if (!topic) return;
    setActiveTopic(topic);
    setLastDrawn(topic.id);
  };

  return (
    <>
      <section className="page-head page-head--saved container">
        <div className="page-head__copy">
          <p className="eyebrow">
            <Icon name="bookmark" size={13} />
            Your shelf
          </p>
          <h1>Saved for later.</h1>
          <p className="page-head__lede">
            A quiet place for the questions you want to return to. Saved topics and reflections
            stay in this browser — no account, no sync, no surveillance.
          </p>
          <div className="page-head__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={drawFromSaved}
              disabled={savedTopics.length === 0}
            >
              <Icon name="shuffle" size={17} />
              Draw from saved
            </button>
            <Link to="/explore" className="btn btn--clay">
              <Icon name="search" size={17} />
              Find more topics
            </Link>
          </div>
        </div>
        <div className="saved-count" aria-hidden="true">
          <span className="saved-count__number">{String(savedTopics.length).padStart(2, '0')}</span>
          <span className="saved-count__label">on your shelf</span>
        </div>
      </section>

      <section className="saved-section container" aria-labelledby="saved-heading">
        <h2 id="saved-heading" className="sr-only">
          Your saved topics
        </h2>
        {savedTopics.length === 0 ? (
          <div className="empty-panel empty-panel--saved">
            <span className="empty-panel__glyph" aria-hidden="true">
              <Icon name="bookmark" size={30} />
            </span>
            <h2>Nothing saved yet.</h2>
            <p>
              When a topic makes you pause, save it. Your shelf is stored locally, so it belongs
              to you and only this browser.
            </p>
            <div className="empty-panel__actions">
              <Link to="/#generate" className="btn btn--primary btn--sm">
                <Icon name="spark" size={16} /> Generate a topic
              </Link>
              <Link to="/explore" className="btn btn--clay btn--sm">
                Browse the library
                <Icon name="arrowUpRight" size={15} />
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="saved-note-row">
              <p>
                <Icon name="info" size={14} />
                Notes you save during a research session appear here too.
              </p>
              <span>{savedTopics.length} saved</span>
            </div>
            <div className="topic-grid">
              {savedTopics.map((topic) => (
                <TopicGridCard
                  key={topic.id}
                  topic={topic}
                  onOpen={setActiveTopic}
                  note={getNote(topic.id)?.text}
                />
              ))}
            </div>
          </>
        )}
      </section>

      <TopicDetailModal
        topic={activeTopic}
        onClose={() => setActiveTopic(null)}
        onSelectTopic={setActiveTopic}
      />
    </>
  );
}
