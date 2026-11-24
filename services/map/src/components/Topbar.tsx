import { useEffect, useMemo, useRef, useState } from 'react';
import { cleanCallsign, formatUtc, t, type Aircraft, type Metar } from '@flightflow/shared';
import { HOME_AIRPORT } from '../config';
import { classifyAircraft } from '../lib/aircraftIcon';
import { IconButton } from './ui/IconButton';
import { StatusBadge } from './ui/StatusBadge';
import { CloseIcon, MoonIcon, PlaneIcon, SearchIcon, SunIcon, TowerIcon } from './ui/icons';

interface Props {
  aircraft: Aircraft[];
  online: boolean;
  now: Date;
  metar: Metar | null;
  metarEnabled: boolean;
  darkMode: boolean;
  onToggleDark: () => void;
  onPick: (hex: string) => void;
  onOpenAirport?: () => void;
}

const MAX_RESULTS = 8;

function haystack(a: Aircraft): string {
  return [cleanCallsign(a.flight), a.r, a.t, a.hex].filter(Boolean).join(' ').toLowerCase();
}

export function Topbar({ aircraft, online, now, metar, metarEnabled, darkMode, onToggleDark, onPick, onOpenAirport }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return aircraft.filter((a) => haystack(a).includes(q)).slice(0, MAX_RESULTS);
  }, [aircraft, query]);

  // `/` enfoca el buscador (salvo si ya se está escribiendo en un campo).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if (e.key === '/' && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Cierra el desplegable al pulsar fuera.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const pick = (hex: string) => {
    onPick(hex);
    setOpen(false);
    inputRef.current?.blur();
  };

  const place = HOME_AIRPORT.icao || t('map.receiver');

  return (
    <>
      <header className="glass-strong absolute inset-x-0 top-0 z-30 border-b border-black/5 pt-[env(safe-area-inset-top)] dark:border-white/10">
        <div className="flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-4">
          {/* Logo */}
          <div className="flex shrink-0 items-center gap-2">
            <PlaneIcon className="h-5 w-5 text-[#007AFF]" />
            <span className="hidden text-sm font-semibold text-gray-900 dark:text-white sm:inline">FlightFlow</span>
            <span className="hidden text-xs font-normal text-gray-400 md:inline">Map</span>
          </div>

          {/* Buscador */}
          <div ref={boxRef} className="relative mx-auto w-full max-w-md flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={open && query.trim() !== ''}
              aria-label={t('map.search.placeholder')}
              placeholder={t('map.search.placeholder')}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && results[0]) pick(results[0].hex);
                if (e.key === 'Escape') {
                  setOpen(false);
                  inputRef.current?.blur();
                }
              }}
              className="input h-10 w-full pl-9 pr-9"
            />
            {query && (
              <button
                type="button"
                aria-label={t('map.search.clear')}
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </button>
            )}

            {open && query.trim() !== '' && (
              <ul
                role="listbox"
                className="glass absolute left-0 right-0 top-12 max-h-80 overflow-y-auto rounded-xl py-1"
              >
                {results.length === 0 && (
                  <li className="px-3 py-3 text-sm text-gray-500 dark:text-[#8E8E93]">{t('map.search.empty')}</li>
                )}
                {results.map((a) => {
                  const kind = classifyAircraft(a.t, a.category);
                  return (
                    <li key={a.hex} role="option" aria-selected={false}>
                      <button
                        type="button"
                        onClick={() => pick(a.hex)}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-black/5 dark:hover:bg-white/8"
                      >
                        <PlaneIcon className={`h-4 w-4 shrink-0 text-[#007AFF] ${kind === 'heli' ? 'opacity-60' : ''}`} />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {cleanCallsign(a.flight) || a.hex.toUpperCase()}
                        </span>
                        <span className="ml-auto truncate text-xs text-gray-500 dark:text-[#8E8E93]">
                          {a.r || '—'} · {a.t || a.category || '—'}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Estado, hora y tema */}
          <div className="flex shrink-0 items-center gap-1.5">
            {/* Aeropuerto base (mismo color que su marcador en el mapa): abre su panel */}
            <button
              type="button"
              title={HOME_AIRPORT.name || t('map.homeChip')}
              aria-label={`${t('map.airportLabel')}: ${place}`}
              disabled={!HOME_AIRPORT.icao || !onOpenAirport}
              onClick={onOpenAirport}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#FF9F0A]/15 px-2.5 py-1 text-xs font-semibold text-[#B36B00] transition-colors enabled:hover:bg-[#FF9F0A]/25 dark:text-[#FF9F0A]"
            >
              <TowerIcon className="h-3.5 w-3.5" />
              <span className="hidden font-medium opacity-80 lg:inline">{t('map.airportLabel')}</span>
              {place}
            </button>
            <span className="hidden sm:inline-flex">
              <StatusBadge ok={online} />
            </span>
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full sm:hidden ${online ? 'bg-emerald-500' : 'bg-red-500'}`}
              aria-label={online ? t('common.online') : t('common.offline')}
            />
            <span className="mx-1 hidden whitespace-nowrap text-sm font-semibold tabular-nums text-gray-700 dark:text-gray-200 md:inline">
              {formatUtc(now)}
            </span>
            <IconButton
              label={darkMode ? t('common.lightMode') : t('common.darkMode')}
              onClick={onToggleDark}
            >
              {darkMode ? <SunIcon /> : <MoonIcon />}
            </IconButton>
          </div>
        </div>
      </header>

      {/* METAR: chip sólido sobre el mapa, bajo la barra */}
      {metarEnabled && (
        <div className="absolute left-3 top-[calc(3.5rem+env(safe-area-inset-top)+12px)] z-20 max-w-[min(560px,calc(100vw-96px))] sm:left-auto sm:right-4 sm:top-auto sm:bottom-8">
          <p className="glass rounded-lg px-3 py-1.5 text-[11px] font-medium leading-tight text-gray-700 dark:text-gray-300 sm:text-xs">
            {metar ? metar.raw : t('map.metarLoading')}
          </p>
        </div>
      )}
    </>
  );
}
