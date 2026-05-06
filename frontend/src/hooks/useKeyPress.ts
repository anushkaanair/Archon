import { useEffect, useCallback } from 'react';

/**
 * Fires `handler` when the specified keyboard key is pressed.
 * Automatically ignores events that originate in input, textarea, or select
 * elements unless `allowInInput` is set to true.
 *
 * @example
 * useKeyPress('Escape', () => setOpen(false));
 * useKeyPress('?', () => setShowHelp(v => !v));
 */
export function useKeyPress(
  key: string,
  handler: (event: KeyboardEvent) => void,
  options: { allowInInput?: boolean; ctrlKey?: boolean; metaKey?: boolean } = {},
) {
  const { allowInInput = false, ctrlKey = false, metaKey = false } = options;

  const stable = useCallback(handler, [handler]);

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key !== key) return;
      if (ctrlKey && !e.ctrlKey)   return;
      if (metaKey && !e.metaKey)   return;

      if (!allowInInput) {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (['input', 'textarea', 'select'].includes(tag)) return;
        if ((e.target as HTMLElement)?.isContentEditable) return;
      }

      stable(e);
    };

    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [key, stable, allowInInput, ctrlKey, metaKey]);
}
