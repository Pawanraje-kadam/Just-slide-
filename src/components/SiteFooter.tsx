import { Link } from 'react-router-dom';
import { libraryStats } from '../lib/library';
import { Icon } from './Icons';
import { Logo } from './Logo';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-card">
          <div className="footer-brand">
            <Logo />
            <p className="footer-tagline">
              A curated discovery library for computer science students who would rather
              understand than scroll.
            </p>
            <div className="footer-stat-row">
              <span className="footer-stat">
                <strong>{libraryStats.topics}</strong> topics
              </span>
              <span className="footer-dot" aria-hidden="true" />
              <span className="footer-stat">
                <strong>{libraryStats.categories}</strong> fields
              </span>
              <span className="footer-dot" aria-hidden="true" />
              <span className="footer-stat">15 minutes each</span>
            </div>
          </div>

          <nav className="footer-links" aria-label="Footer">
            <div>
              <p className="footer-heading">Product</p>
              <Link to="/">Discover</Link>
              <Link to="/explore">Knowledge library</Link>
              <Link to="/saved">Saved topics</Link>
            </div>
            <div>
              <p className="footer-heading">Start somewhere</p>
              <Link to="/explore?category=distributed-systems">Distributed systems</Link>
              <Link to="/explore?category=ai-engineering">AI engineering</Link>
              <Link to="/explore?category=operating-systems">Operating systems</Link>
              <Link to="/explore?category=cybersecurity">Security</Link>
            </div>
            <div>
              <p className="footer-heading">The promise</p>
              <p className="footer-note">
                Every entry is reviewed for durable technical value. No account, no feed, no
                generated topic soup.
              </p>
              <Link to="/standard" className="footer-standard-link">
                The library standard <Icon name="arrowUpRight" size={13} />
              </Link>
            </div>
          </nav>

          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} Random Tech. Curated, not crawled.</p>
            <p className="footer-signoff">
              <span className="status-dot" aria-hidden="true" />
              Built for curious engineers
              <Icon name="sparkSmall" size={13} />
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
