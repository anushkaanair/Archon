import { useState, useEffect } from 'react';

/**
 * useState that persists to localStorage. Reads initial value from
 * storage on mount; syncs every update. Falls back gracefully if
 * localStorage is unavailable (private browsing, quota exceeded).
 *
 * @example
 * const [theme, setTheme] = useLocalStorage('archon_theme', 'light');
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const readValue = (): T => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const next = value instanceof Function ? value(storedValue) : value;
      window.localStorage.setItem(key, JSON.stringify(next));
      setStoredValue(next);
    } catch {
      setStoredValue(value instanceof Function ? value(storedValue) : value);
    }
  };

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try { setStoredValue(JSON.parse(e.newValue)); } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [key]);

  return [storedValue, setValue];
}
