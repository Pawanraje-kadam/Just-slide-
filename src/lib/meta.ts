import { useEffect } from 'react';

const SITE = 'Random Tech';

function setMetaDescription(content: string) {
  let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!tag) {
    tag = document.createElement('meta');
    tag.name = 'description';
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function setCanonical(path: string) {
  let tag = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!tag) {
    tag = document.createElement('link');
    tag.rel = 'canonical';
    document.head.appendChild(tag);
  }
  tag.href = `${window.location.origin}${path}`;
}

export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title === SITE ? `${SITE} — Discover What Matters` : `${title} · ${SITE}`;
    if (description) setMetaDescription(description);
    setCanonical(window.location.pathname);
  }, [title, description]);
}
