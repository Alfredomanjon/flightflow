import { useEffect, useState } from 'react';
import { fetchLiveAircraft } from '../api';
import type { Aircraft } from '../types';

export interface AircraftState {
  aircraft: Aircraft[];
  withPosition: Aircraft[];
  lastUpdate: number | null;
  online: boolean;
  error: string | null;
}

/** Polls /api/live/aircraft every `refreshMs`; `online` turns false after `onlineTimeoutMs` without data. */
export function useAircraft(refreshMs = 1000, onlineTimeoutMs = 5000): AircraftState {
  const [state, setState] = useState<AircraftState>({
    aircraft: [],
    withPosition: [],
    lastUpdate: null,
    online: false,
    error: null,
  });

  useEffect(() => {
    const ctrl = new AbortController();
    let cancelled = false;

    const tick = async () => {
      try {
        const data = await fetchLiveAircraft(ctrl.signal);
        if (cancelled) return;
        setState({
          aircraft: data.aircraft,
          withPosition: data.aircraft.filter((a) => typeof a.lat === 'number' && typeof a.lon === 'number'),
          lastUpdate: Date.now(),
          online: true,
          error: null,
        });
      } catch (err) {
        if (cancelled || (err as Error).name === 'AbortError') return;
        setState((prev) => ({ ...prev, online: false, error: (err as Error).message }));
      }
    };

    tick();
    const id = window.setInterval(tick, refreshMs);
    const healthId = window.setInterval(() => {
      setState((prev) => {
        if (prev.lastUpdate == null) return prev;
        const isOnline = Date.now() - prev.lastUpdate < onlineTimeoutMs;
        return prev.online === isOnline ? prev : { ...prev, online: isOnline };
      });
    }, 1000);

    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearInterval(id);
      window.clearInterval(healthId);
    };
  }, [refreshMs, onlineTimeoutMs]);

  return state;
}
