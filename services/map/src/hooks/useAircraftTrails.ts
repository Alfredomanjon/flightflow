import { useEffect, useRef, useState } from 'react';
import type { Aircraft } from '@flightflow/shared';

const MAX_POINTS_PER_AIRCRAFT = 1200;

export interface AircraftTrails {
  getTrail: (hex: string) => [number, number][] | undefined;
  version: number;
}

export function useAircraftTrails(positions: Aircraft[]): AircraftTrails {
  const trailsRef = useRef<Map<string, [number, number][]>>(new Map());
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let changed = false;
    for (const a of positions) {
      if (typeof a.lat !== 'number' || typeof a.lon !== 'number') continue;
      const arr = trailsRef.current.get(a.hex) ?? [];
      const last = arr[arr.length - 1];
      if (!last || last[0] !== a.lon || last[1] !== a.lat) {
        arr.push([a.lon, a.lat]);
        if (arr.length > MAX_POINTS_PER_AIRCRAFT) arr.shift();
        trailsRef.current.set(a.hex, arr);
        changed = true;
      }
    }
    if (changed) setVersion((v) => v + 1);
  }, [positions]);

  return {
    getTrail: (hex) => trailsRef.current.get(hex),
    version,
  };
}
