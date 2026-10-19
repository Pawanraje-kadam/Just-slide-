import { Link } from 'react-router-dom';
import { Icon } from '../components/Icons';
import { libraryStats } from '../lib/library';
import { usePageMeta } from '../lib/meta';

export function NotFound() {
  usePageMeta('Page not found', 'The page you were looking for does not exist.');
  return (
    <section className="not-found container">
      <div className="not-found__card">
        <span className="not-found__glyph" aria-hidden="true">
          <Icon name="compass" size={34} />
        </span>
        <p className="eyebrow">Error 404</p>
        <h1>This idea isn&rsquo;t on the map.</h1>
        <p>
          The page you were looking for does not exist. The library, however, has {libraryStats.topics} questions
          worth your time.
        </p>
        <div className="not-found__actions">
          <Link to="/" className="btn btn--primary">
            <Icon name="spark" size={17} /> Draw a topic
          </Link>
          <Link to="/explore" className="btn btn--clay">
            Explore the library <Icon name="arrowUpRight" size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
