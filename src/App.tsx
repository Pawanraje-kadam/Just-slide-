import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Discover } from './pages/Discover';

const Explore = lazy(() => import('./pages/Explore').then((module) => ({ default: module.Explore })));
const Saved = lazy(() => import('./pages/Saved').then((module) => ({ default: module.Saved })));
const Research = lazy(() => import('./pages/Research').then((module) => ({ default: module.Research })));
const Standard = lazy(() => import('./pages/Standard').then((module) => ({ default: module.Standard })));
const NotFound = lazy(() => import('./pages/NotFound').then((module) => ({ default: module.NotFound })));

function RouteFallback() {
  return (
    <div className="route-loading container" role="status" aria-live="polite">
      <span className="route-loading__dot" aria-hidden="true" />
      <span>Opening the library…</span>
    </div>
  );
}

export function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Discover />} />
          <Route path="explore" element={<Explore />} />
          <Route path="saved" element={<Saved />} />
          <Route path="standard" element={<Standard />} />
          <Route path="research/:topicId" element={<Research />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
