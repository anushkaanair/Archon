import { useEffect, RefObject } from 'react';

/**
 * Fires `handler` when a click or touch event occurs outside of `ref`.
 * Useful for closing dropdowns, modals, and popovers on outside-click.
 *
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * useOnClickOutside(ref, () => setOpen(false));
 */
export function useOnClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: MouseEvent | TouchEvent) => void,
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el || el.contains(event.target as Node)) return;
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}
