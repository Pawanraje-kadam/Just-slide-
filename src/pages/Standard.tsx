import { Link } from 'react-router-dom';
import { Icon } from '../components/Icons';
import { libraryStats } from '../lib/library';
import { usePageMeta } from '../lib/meta';

const rules = [
  {
    title: 'It teaches a mechanism',
    body: 'A topic must explain how something actually works, not just name it. Definitions belong in a glossary; mechanisms belong here.',
  },
  {
    title: 'It changes how you build',
    body: 'The value has to survive contact with real software: performance, reliability, security, correctness, or the cost of change.',
  },
  {
    title: 'It fits fifteen real minutes',
    body: 'Scope is part of quality. Each question can be researched to a useful first understanding in one focused sitting.',
  },
  {
    title: 'It is specific',
    body: '“Why can a build produce non-reproducible artifacts?” is a topic. “Build systems” is a search category.',
  },
  {
    title: 'It is evergreen or durable',
    body: 'Emerging topics must teach an underlying idea. We do not archive the news cycle or rank topics by social attention.',
  },
  {
    title: 'It is not a duplicate',
    body: 'Rewording the same question does not create a new topic. Titles are normalized and checked for near-duplicates inside each field.',
  },
  {
    title: 'It assumes the basics',
    body: 'The library starts after “what is a variable”. It is written for students who can already write and read code.',
  },
  {
    title: 'It rewards independent thought',
    body: 'Every record includes a research question that can be pursued without a prescribed article or a passive video.',
  },
  {
    title: 'It stays honest about AI',
    body: 'AI topics explain evaluation, inference, retrieval, or failure modes. They are not a tour of last month’s product launches.',
  },
  {
    title: 'It earns fifteen minutes',
    body: 'The final test is simple: after reading the title, would a curious engineer want to know the answer? If not, it is cut.',
  },
];

const excluded = [
  'Dictionary definitions and “intro to programming” material',
  'Trend names without an underlying technical idea',
  'Reworded duplicates that inflate the count',
  'Listicles, tool rankings, and career advice',
  'Generated titles that no reviewer has read',
];

export function Standard() {
  usePageMeta(
    'The library standard',
    'How Random Tech curates its topic library: ten quality rules, what gets excluded, and an honest account of the current dataset size.',
  );

  return (
    <>
      <section className="page-head container">
        <div className="page-head__copy">
          <p className="eyebrow">
            <Icon name="check" size={13} />
            The library standard
          </p>
          <h1>Curated, not crawled.</h1>
          <p className="page-head__lede">
            The value of a discovery tool is decided by what it refuses to show you. Every topic
            here is checked against ten rules before it can enter the library — and the count on
            the homepage is the real count.
          </p>
          <div className="page-head__actions">
            <Link to="/#generate" className="btn btn--primary">
              <Icon name="spark" size={17} /> Generate a topic
            </Link>
            <Link to="/explore" className="btn btn--clay">
              <Icon name="layers" size={17} /> Explore the library
            </Link>
          </div>
        </div>
        <div className="standard-stats" aria-label="Library at a glance">
          <div className="standard-stat">
            <span className="standard-stat__value">{libraryStats.topics}</span>
            <span className="standard-stat__label">validated topics</span>
          </div>
          <div className="standard-stat">
            <span className="standard-stat__value">{libraryStats.categories}</span>
            <span className="standard-stat__label">fields of computing</span>
          </div>
          <div className="standard-stat">
            <span className="standard-stat__value">0</span>
            <span className="standard-stat__label">invented at runtime</span>
          </div>
        </div>
      </section>

      <section className="standard-section container" aria-labelledby="rules-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              <Icon name="listCheck" size={13} />
              Ten rules
            </p>
            <h2 id="rules-heading">What every topic must survive.</h2>
          </div>
          <p className="section-sub standard-intro">
            These are editorial gates, not guidelines. A candidate that fails one is rejected
            rather than softened into the database.
          </p>
        </div>

        <ol className="rule-grid">
          {rules.map((rule, index) => (
            <li key={rule.title} className="rule-card">
              <span className="rule-card__number">{String(index + 1).padStart(2, '0')}</span>
              <h3>{rule.title}</h3>
              <p>{rule.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="standard-section container" aria-labelledby="excluded-heading">
        <div className="split-panel">
          <div className="split-panel__copy">
            <p className="eyebrow">
              <Icon name="eyeOff" size={13} />
              Deliberate omissions
            </p>
            <h2 id="excluded-heading">What stays out.</h2>
            <p>
              A smaller library that respects your attention is more useful than a large one that
              wastes it. These categories are excluded by design, not by accident.
            </p>
          </div>
          <ul className="exclusion-list">
            {excluded.map((item) => (
              <li key={item}>
                <span className="exclusion-mark" aria-hidden="true">
                  <Icon name="close" size={12} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="standard-section container" aria-labelledby="number-heading">
        <div className="honesty-card">
          <span className="honesty-card__mark" aria-hidden="true">
            <Icon name="info" size={22} />
          </span>
          <div className="honesty-card__copy">
            <p className="eyebrow">The honest number</p>
            <h2 id="number-heading">Why the library has {libraryStats.topics} topics, not 10,000.</h2>
            <p>
              The target is a library of ten thousand topics that are worth your time. Reaching
              that number by combining words or rewording the same idea would destroy the only
              thing that makes this product useful: editorial trust.
            </p>
            <p>
              This release ships {libraryStats.topics} reviewed questions across{' '}
              {libraryStats.categories} fields. The content pipeline validates every record,
              rejects near-duplicates, and enforces coverage minimums per field. New reviewed
              batches expand the library without lowering the bar — and this page will report the
              real count when they do.
            </p>
            <div className="honesty-card__actions">
              <Link to="/explore" className="btn btn--primary btn--sm">
                Read the library <Icon name="arrowRight" size={15} />
              </Link>
              <Link to="/#generate" className="btn btn--clay btn--sm">
                <Icon name="shuffle" size={15} /> Draw from it
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
