import { useEffect, useState } from 'react';

/** Calls `fetcher` now and every `intervalMs`; keeps the last successful value. */
export function usePolling<T>(fetcher: (signal: AbortSignal) => Promise<T>, intervalMs: number, enabled = true): T | null {
  const [value, setValue] = useState<T | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const ctrl = new AbortController();
    let cancelled = false;
    const tick = async () => {
      try {
        const v = await fetcher(ctrl.signal);
        if (!cancelled) setValue(v);
      } catch {
        /* keep last value; errors are transient (receiver/network) */
      }
    };
    tick();
    const id = window.setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearInterval(id);
    };
  }, [intervalMs, enabled]);

  return value;
}
