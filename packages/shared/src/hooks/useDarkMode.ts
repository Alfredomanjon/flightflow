import { useEffect, useState } from 'react';

/**
 * Dark mode toggle persisted in localStorage. The `dark` class on <html> drives Tailwind's dark variant.
 * Without a stored choice it follows the system (or `fallback` when given).
 */
export function useDarkMode(storageKey = 'ff:dark-mode', fallback?: boolean): [boolean, () => void] {
  const [dark, setDark] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) return stored === 'true';
    } catch {
      /* storage unavailable */
    }
    if (fallback !== undefined) return fallback;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem(storageKey, String(dark));
    } catch {
      /* storage unavailable */
    }
  }, [dark, storageKey]);

  return [dark, () => setDark((d) => !d)];
}
