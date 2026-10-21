import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { RouteFrame } from '../motion/RouteFrame';
import { ScrollProgress } from '../motion/ScrollProgress';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      const target = document.getElementById(id);
      if (target) {
        window.requestAnimationFrame(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname, hash]);

  return null;
}

export function Layout() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <ScrollManager />
      <div className="site-atmosphere" aria-hidden="true">
        <span className="ambient ambient--one" />
        <span className="ambient ambient--two" />
        <span className="ambient ambient--three" />
      </div>
      <ScrollProgress />
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        <RouteFrame>
          <Outlet />
        </RouteFrame>
      </main>
      <SiteFooter />
    </>
  );
}
