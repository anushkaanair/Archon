import { useState, useEffect } from 'react';

/**
 * Returns true when the given CSS media query matches the current viewport.
 * Re-evaluates automatically when the viewport changes.
 *
 * @example
 * const isMobile  = useMediaQuery('(max-width: 767px)');
 * const isDark    = useMediaQuery('(prefers-color-scheme: dark)');
 * const isTablet  = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);

    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
