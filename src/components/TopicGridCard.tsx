import { categoryFor } from '../lib/library';
import type { Topic } from '../types';
import { useSaved } from '../providers/SavedProvider';
import { useToast } from '../providers/ToastProvider';
import { CategoryGlyph } from './CategoryGlyph';
import { CopyButton } from './CopyButton';
import { DifficultyMeter } from './DifficultyMeter';
import { Icon } from './Icons';

interface TopicGridCardProps {
  topic: Topic;
  onOpen: (topic: Topic) => void;
  note?: string;
}

export function TopicGridCard({ topic, onOpen, note }: TopicGridCardProps) {
  const category = categoryFor(topic);
  const { isSaved, toggleSaved } = useSaved();
  const { notify } = useToast();
  const saved = isSaved(topic.id);

  const handleSave = () => {
    const nowSaved = toggleSaved(topic.id);
    notify(
      nowSaved ? 'Saved for later. Find it under Saved Topics.' : 'Removed from saved topics.',
      nowSaved ? 'success' : 'info',
    );
  };

  return (
    <article className="topic-tile" data-family={category?.family ?? 'lavender'}>
      <div className="topic-tile__inner">
        <div className="topic-tile__top">
          <span className="topic-tile__category">
            <CategoryGlyph category={category} size="sm" />
            <span>{category?.name ?? topic.category}</span>
          </span>
          <button
            type="button"
            className={`icon-btn tile-save${saved ? ' is-saved' : ''}`}
            onClick={handleSave}
            aria-label={saved ? `Remove ${topic.title} from saved topics` : `Save ${topic.title}`}
            aria-pressed={saved}
          >
            <Icon name={saved ? 'bookmarkFilled' : 'bookmark'} size={17} />
          </button>
        </div>

        <button
          type="button"
          className="topic-tile__hit"
          onClick={() => onOpen(topic)}
          aria-label={`Open topic: ${topic.title}`}
        />

        <div className="topic-tile__body">
          <div className="topic-tile__meta">
            <DifficultyMeter difficulty={topic.difficulty} />
            <span className="meta-sep" aria-hidden="true" />
            <span className="time-chip">
              <Icon name="clock" size={13} />
              {topic.estimatedMinutes} min
            </span>
            <span className={`micro-badge${topic.aiRelevance ? '' : ' micro-badge--mint'}`}>
              {topic.aiRelevance ? 'AI-era' : 'Evergreen'}
            </span>
          </div>
          <h3 className="topic-tile__title">{topic.title}</h3>
          <p className="topic-tile__summary">{topic.summary}</p>
        </div>

        {note && (
          <div className="tile-note">
            <span className="tile-note__label">
              <Icon name="bulb" size={13} /> Your note
            </span>
            <p>{note}</p>
          </div>
        )}

        <div className="topic-tile__footer">
          <span className="tile-read">
            Read the brief <Icon name="arrowUpRight" size={14} />
          </span>
          <CopyButton
            text={topic.title}
            label={`Copy ${topic.title}`}
            copiedLabel="Copied"
            className="icon-btn tile-copy"
            toastMessage="Topic copied to your clipboard."
            iconOnly
            iconSize={16}
          />
        </div>
      </div>
    </article>
  );
}
