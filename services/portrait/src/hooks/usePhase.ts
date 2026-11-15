import { useMemo, useRef } from 'react';
import type { NearPlane } from './useNearest';
import { PHASE_HOLD_MS, PHASE_MAX_ALT_FT, PHASE_MIN_RATE_FPM, PHASE_RELEASE_MS } from '../config';

export type Phase = 'landing' | 'takeoff';

interface Track {
  /** Phase the plane currently meets (or null) and since when. */
  candidate: Phase | null;
  since: number;
  /** Phase being shown and when the condition was last met. */
  shown: Phase | null;
  lastMet: number;
  /** Altitude samples, to derive a rate when the receiver reports none. */
  samples: { t: number; alt: number }[];
}

function instantPhase(plane: NearPlane, track: Track, now: number): Phase | null {
  const { ac } = plane;
  if (typeof ac.alt_baro !== 'number' || ac.alt_baro >= PHASE_MAX_ALT_FT) return null;

  let rate = ac.baro_rate ?? ac.geom_rate;
  if (rate == null) {
    // No vertical rate from the receiver: derive it from ~10 s of altitude history.
    const first = track.samples[0];
    if (first && now - first.t >= 8_000) rate = ((ac.alt_baro - first.alt) / (now - first.t)) * 60_000;
  }
  if (rate == null) return null;
  if (rate <= -PHASE_MIN_RATE_FPM) return 'landing';
  if (rate >= PHASE_MIN_RATE_FPM) return 'takeoff';
  return null;
}

/**
 * Landing / take-off per plane: below PHASE_MAX_ALT_FT and climbing or descending
 * at ≥ PHASE_MIN_RATE_FPM, sustained for PHASE_HOLD_MS. Once shown it stays until
 * the condition has been lost for PHASE_RELEASE_MS, so it does not flicker.
 */
export function usePhase(planes: NearPlane[]): Map<string, Phase> {
  const tracks = useRef(new Map<string, Track>());

  return useMemo(() => {
    const now = Date.now();
    const out = new Map<string, Phase>();
    const seen = new Set<string>();

    for (const p of planes) {
      const hex = p.ac.hex;
      seen.add(hex);
      let tr = tracks.current.get(hex);
      if (!tr) {
        tr = { candidate: null, since: now, shown: null, lastMet: 0, samples: [] };
        tracks.current.set(hex, tr);
      }
      if (typeof p.ac.alt_baro === 'number') {
        tr.samples.push({ t: now, alt: p.ac.alt_baro });
        while (tr.samples.length > 1 && now - tr.samples[1].t >= 10_000) tr.samples.shift();
      }

      const inst = instantPhase(p, tr, now);
      if (inst !== tr.candidate) {
        tr.candidate = inst;
        tr.since = now;
      }
      if (inst) {
        tr.lastMet = now;
        if (tr.shown !== inst && now - tr.since >= PHASE_HOLD_MS) tr.shown = inst;
      } else if (tr.shown && now - tr.lastMet >= PHASE_RELEASE_MS) {
        tr.shown = null;
      }
      if (tr.shown) out.set(hex, tr.shown);
    }

    for (const hex of tracks.current.keys()) if (!seen.has(hex)) tracks.current.delete(hex);
    return out;
  }, [planes]);
}
