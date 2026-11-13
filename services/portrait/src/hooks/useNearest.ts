import { useMemo, useRef } from 'react';
import { distanceKm, type Aircraft } from '@flightflow/shared';
import { receiver, STALE_POS_S, SWAP_HYSTERESIS } from '../config';

export interface NearPlane {
  ac: Aircraft;
  distKm: number;
}

export interface NearestResult {
  /** Aviones a mostrar, en orden de "slot" estable. */
  planes: NearPlane[];
  /** Avión más cercano fuera del radio (para el estado vacío). */
  nearestOutside: NearPlane | null;
  /** Aviones en el aire con posición dentro del radio. */
  inRange: number;
}

/**
 * Selecciona los `max` aviones más cercanos al receptor dentro de `radiusKm`.
 * Mantiene los ya mostrados en su sitio para que el cuadro no parpadee: un
 * avión nuevo sólo desplaza al más lejano si está claramente más cerca.
 */
export function useNearest(aircraft: Aircraft[], radiusKm: number, max: number): NearestResult {
  const slotsRef = useRef<string[]>([]);

  return useMemo(() => {
    const rx = receiver();
    const airborne: NearPlane[] = [];
    for (const ac of aircraft) {
      if (typeof ac.lat !== 'number' || typeof ac.lon !== 'number') continue;
      if (ac.alt_baro === 'ground') continue;
      if ((ac.seen_pos ?? 0) > STALE_POS_S) continue;
      airborne.push({ ac, distKm: distanceKm(rx.lat, rx.lon, ac.lat, ac.lon) });
    }
    airborne.sort((a, b) => a.distKm - b.distKm);

    const inside = airborne.filter((p) => p.distKm <= radiusKm);
    const byHex = new Map(inside.map((p) => [p.ac.hex, p]));

    // 1. Conservar los que siguen dentro del radio.
    let slots = slotsRef.current.filter((h) => byHex.has(h));
    // Si se redujo el máximo, sobran los más lejanos.
    while (slots.length > max) {
      const far = slots.reduce((a, b) => (byHex.get(a)!.distKm >= byHex.get(b)!.distKm ? a : b));
      slots = slots.filter((h) => h !== far);
    }

    // 2. Incorporar los candidatos del top-N.
    for (const cand of inside.slice(0, max)) {
      if (slots.includes(cand.ac.hex)) continue;
      if (slots.length < max) {
        slots.push(cand.ac.hex);
        continue;
      }
      const far = slots.reduce((a, b) => (byHex.get(a)!.distKm >= byHex.get(b)!.distKm ? a : b));
      if (cand.distKm < byHex.get(far)!.distKm * SWAP_HYSTERESIS) {
        slots = slots.map((h) => (h === far ? cand.ac.hex : h));
      }
    }

    slotsRef.current = slots;
    return {
      planes: slots.map((h) => byHex.get(h)!),
      nearestOutside: airborne.find((p) => p.distKm > radiusKm) ?? null,
      inRange: inside.length,
    };
  }, [aircraft, radiusKm, max]);
}
