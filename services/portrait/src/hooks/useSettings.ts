import { useCallback, useEffect, useMemo, useState } from 'react';
import { config } from '@flightflow/shared';
import { MAX_RADIUS_KM, MIN_RADIUS_KM } from '../config';

export type FrameStyle = 'lamina' | 'plano' | 'noche';
export type Ink = 'red' | 'blue' | 'black';
/** row = seguidos; pyramid = con 3 aviones, 2 arriba y 1 abajo centrado. */
export type Layout = 'row' | 'pyramid';

export interface Settings {
  style: FrameStyle;
  ink: Ink;
  maxPlanes: 1 | 2 | 3;
  layout: Layout;
  radiusKm: number;
  show: {
    reg: boolean;
    speed: boolean;
    dist: boolean;
    logo: boolean;
  };
}

const KEY = 'ff:portrait-settings';
const STYLES: FrameStyle[] = ['lamina', 'plano', 'noche'];
const INKS: Ink[] = ['red', 'blue', 'black'];
const LAYOUTS: Layout[] = ['row', 'pyramid'];

function prefersDark(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

function defaults(): Settings {
  return {
    style: prefersDark() ? 'noche' : 'lamina',
    ink: 'red',
    maxPlanes: config().portrait.max_planes as 1 | 2 | 3,
    layout: 'row',
    radiusKm: clampRadius(config().portrait.default_radius_km),
    show: { reg: true, speed: true, dist: true, logo: true },
  };
}

export const clampRadius = (v: number) => Math.min(MAX_RADIUS_KM, Math.max(MIN_RADIUS_KM, Math.round(v)));

function load(): Settings {
  const base = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const s = JSON.parse(raw) as Partial<Settings>;
    return {
      style: STYLES.includes(s.style as FrameStyle) ? (s.style as FrameStyle) : base.style,
      ink: INKS.includes(s.ink as Ink) ? (s.ink as Ink) : base.ink,
      maxPlanes: [1, 2, 3].includes(s.maxPlanes as number) ? (s.maxPlanes as 1 | 2 | 3) : base.maxPlanes,
      layout: LAYOUTS.includes(s.layout as Layout) ? (s.layout as Layout) : base.layout,
      radiusKm: typeof s.radiusKm === 'number' ? clampRadius(s.radiusKm) : base.radiusKm,
      show: { ...base.show, ...(s.show ?? {}) },
    };
  } catch {
    return base;
  }
}

/** Parámetros de URL que fijan la configuración (útil en modo kiosco). */
function urlOverrides(): Partial<Settings> {
  const q = new URLSearchParams(window.location.search);
  const o: Partial<Settings> = {};
  const style = q.get('style') as FrameStyle | null;
  if (style && STYLES.includes(style)) o.style = style;
  const ink = q.get('ink') as Ink | null;
  if (ink && INKS.includes(ink)) o.ink = ink;
  const n = Number(q.get('n'));
  if ([1, 2, 3].includes(n)) o.maxPlanes = n as 1 | 2 | 3;
  const layout = q.get('layout') as Layout | null;
  if (layout && LAYOUTS.includes(layout)) o.layout = layout;
  const r = Number(q.get('radius'));
  if (r > 0) o.radiusKm = clampRadius(r);
  return o;
}

export function useSettings() {
  const [stored, setStored] = useState<Settings>(load);
  const overrides = useMemo(urlOverrides, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(stored));
    } catch {
      /* almacenamiento no disponible — se ignora */
    }
  }, [stored]);

  const update = useCallback((patch: Partial<Settings>) => {
    setStored((s) => ({ ...s, ...patch, show: { ...s.show, ...(patch.show ?? {}) } }));
  }, []);

  const fixed = overrides;
  // Los ajustes elegidos en pantalla ganan sobre la URL una vez que se tocan.
  const [touched, setTouched] = useState<Set<keyof Settings>>(() => new Set());
  const settings: Settings = { ...stored };
  for (const [k, v] of Object.entries(fixed) as [keyof Settings, never][]) {
    if (!touched.has(k)) (settings as unknown as Record<string, unknown>)[k] = v;
  }

  const set = useCallback(
    (patch: Partial<Settings>) => {
      setTouched((t) => new Set([...t, ...(Object.keys(patch) as (keyof Settings)[])]));
      update(patch);
    },
    [update],
  );

  return { settings, set };
}
