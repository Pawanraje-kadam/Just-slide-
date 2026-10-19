import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../providers/ThemeProvider';
import { useSaved } from '../providers/SavedProvider';
import { Icon } from './Icons';
import { Logo } from './Logo';

const links = [
  { to: '/', label: 'Discover', end: true },
  { to: '/explore', label: 'Explore Topics', end: false },
  { to: '/saved', label: 'Saved Topics', end: false },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { resolved, toggleTheme } = useTheme();
  const { savedIds } = useSaved();
  const location = useLocation();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && headerRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [menuOpen]);

  return (
    <header className="site-header" ref={headerRef}>
      <div className="container">
        <nav className="nav-shell" aria-label="Primary">
          <Logo />

          <div className="nav-links">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
              >
                {link.label}
                {link.to === '/saved' && savedIds.length > 0 && (
                  <span className="nav-count" aria-label={`${savedIds.length} saved`}>
                    {savedIds.length}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          <div className="nav-tools">
            <button
              type="button"
              className="icon-btn theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${resolved === 'light' ? 'dark' : 'light'} theme`}
              title={`Switch to ${resolved === 'light' ? 'dark' : 'light'} theme`}
            >
              <Icon name={resolved === 'light' ? 'moon' : 'sun'} size={18} />
            </button>
            <button
              type="button"
              className="icon-btn menu-toggle"
              onClick={() => setMenuOpen((value) => !value)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              <Icon name={menuOpen ? 'close' : 'menu'} size={19} />
            </button>
          </div>
        </nav>

        <div
          id="mobile-menu"
          className={`mobile-menu${menuOpen ? ' is-open' : ''}`}
          hidden={!menuOpen}
        >
          <div className="mobile-menu__links">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `mobile-link${isActive ? ' is-active' : ''}`}
              >
                <span>{link.label}</span>
                {link.to === '/saved' && savedIds.length > 0 && (
                  <span className="nav-count">{savedIds.length}</span>
                )}
                <Icon name="arrowUpRight" size={18} />
              </NavLink>
            ))}
          </div>
          <div className="mobile-menu__footer">
            <Link to="/#generate" className="btn btn--primary btn--sm">
              <Icon name="spark" size={16} />
              Generate a topic
            </Link>
            <p>One random topic. Fifteen minutes. No feed.</p>
          </div>
        </div>
      </div>
    </header>
  );
}
