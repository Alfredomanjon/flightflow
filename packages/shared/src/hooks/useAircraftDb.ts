import { useEffect, useRef, useState } from 'react';
import { lookupAircraft, type AircraftInfo } from '../hexdb';

type Entry = AircraftInfo | null;

const MAX_PARALLEL = 4;

function loadCache(key: string): Record<string, Entry> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, Entry>) : {};
  } catch {
    return {};
  }
}

function persistCache(key: string, cache: Record<string, Entry>): void {
  try {
    localStorage.setItem(key, JSON.stringify(cache));
  } catch {
    /* quota or storage unavailable — ignore */
  }
}

/**
 * Registration/type/operator from hexdb.io for the given ICAO hex codes, cached in localStorage
 * under `cacheKey` (one cache per app).
 */
export function useAircraftDb(hexes: string[], cacheKey = 'flightflow:hexdb-v1'): Record<string, AircraftInfo> {
  const cacheRef = useRef<Record<string, Entry>>({});
  const inflightRef = useRef(new Set<string>());
  const [, setVersion] = useState(0);

  if (Object.keys(cacheRef.current).length === 0) {
    cacheRef.current = loadCache(cacheKey);
  }

  const key = hexes.slice().sort().join(',');

  useEffect(() => {
    const pending = hexes.filter(
      (h) => !(h in cacheRef.current) && !inflightRef.current.has(h),
    );
    if (pending.length === 0) return;

    const ctrl = new AbortController();
    let cancelled = false;
    let dirty = false;

    const worker = async (queue: string[]) => {
      while (queue.length > 0 && !cancelled) {
        const hex = queue.shift()!;
        inflightRef.current.add(hex);
        try {
          const info = await lookupAircraft(hex, ctrl.signal);
          cacheRef.current[hex] = info;
          dirty = true;
        } catch (err) {
          if ((err as Error).name === 'AbortError') return;
        } finally {
          inflightRef.current.delete(hex);
        }
      }
    };

    const queue = [...pending];
    const workers = Array.from(
      { length: Math.min(MAX_PARALLEL, queue.length) },
      () => worker(queue),
    );

    Promise.all(workers).then(() => {
      if (cancelled) return;
      if (dirty) {
        persistCache(cacheKey, cacheRef.current);
        setVersion((v) => v + 1);
      }
    });

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [key]);

  const result: Record<string, AircraftInfo> = {};
  for (const hex of hexes) {
    const entry = cacheRef.current[hex];
    if (entry) result[hex] = entry;
  }
  return result;
}
