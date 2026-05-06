import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

/**
 * Returns the current browser window dimensions and re-renders on resize.
 * Safe to call on SSR (returns 0×0 on initial render before mount).
 *
 * @example
 * const { width, height } = useWindowSize();
 * const isMobile = width < 768;
 */
export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>({ width: 0, height: 0 });

  useEffect(() => {
    const update = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });

    update(); // set immediately on mount
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return size;
}
