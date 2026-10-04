import { useEffect } from 'react';

/**
 * Fades in every element with a `data-reveal` attribute as it scrolls into view.
 * Re-scans when `deps` change (e.g. after data loads). No-op where IntersectionObserver is missing.
 */
export function useReveal(deps = []) {
  useEffect(() => {
    const els = [...document.querySelectorAll('[data-reveal]:not(.is-visible)')];
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}
