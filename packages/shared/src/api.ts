// Client for the collector's live endpoints. The apps never talk to the receiver directly.
import type { AircraftResponse, Metar, StatsResponse } from './types';

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(path, { signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`${path} HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export const fetchLiveAircraft = (signal?: AbortSignal) =>
  getJson<AircraftResponse>('/api/live/aircraft', signal);

export const fetchLiveStats = (signal?: AbortSignal) =>
  getJson<StatsResponse>('/api/live/stats', signal);

export const fetchMetar = (signal?: AbortSignal) => getJson<Metar | null>('/api/metar', signal);
