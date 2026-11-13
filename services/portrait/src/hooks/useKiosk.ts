import { useCallback, useEffect, useState } from 'react';

/** Coincidencia de una media query, actualizada al girar o redimensionar. */
export function useMediaQuery(query: string): boolean {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const sync = () => setMatch(mql.matches);
    sync();
    mql.addEventListener('change', sync);
    return () => mql.removeEventListener('change', sync);
  }, [query]);
  return match;
}

/** true mientras hubo actividad (ratón, toque, teclado) en los últimos `ms`. */
export function useActivity(ms: number): boolean {
  const [active, setActive] = useState(true);
  useEffect(() => {
    let id = window.setTimeout(() => setActive(false), ms);
    const poke = () => {
      setActive(true);
      window.clearTimeout(id);
      id = window.setTimeout(() => setActive(false), ms);
    };
    const events = ['mousemove', 'pointerdown', 'keydown', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, poke, { passive: true }));
    return () => {
      window.clearTimeout(id);
      events.forEach((e) => window.removeEventListener(e, poke));
    };
  }, [ms]);
  return active;
}

export function useFullscreen(): [boolean, () => void] {
  const [on, setOn] = useState(() => document.fullscreenElement != null);
  useEffect(() => {
    const sync = () => setOn(document.fullscreenElement != null);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  const toggle = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);
  return [on, toggle];
}

/** Evita que la pantalla se apague (si el navegador lo soporta). */
export function useWakeLock(): void {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const request = async () => {
      if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
      try {
        lock = await navigator.wakeLock.request('screen');
        if (cancelled) void lock.release();
      } catch {
        /* denegado o no soportado */
      }
    };
    void request();
    document.addEventListener('visibilitychange', request);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', request);
      void lock?.release().catch(() => {});
    };
  }, []);
}

/** Tamaño en px de un elemento, actualizado con ResizeObserver. */
export function useElementSize<T extends HTMLElement>(): [(el: T | null) => void, { w: number; h: number }] {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [el, setEl] = useState<T | null>(null);
  useEffect(() => {
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((s) => (s.w === width && s.h === height ? s : { w: width, h: height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [setEl, size];
}
