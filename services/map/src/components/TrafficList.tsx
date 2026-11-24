import { useEffect, useMemo, useRef, useState } from 'react';
import {
  altitude,
  altitudeUnit,
  cleanCallsign,
  distance,
  distanceUnit,
  distanceKm,
  formatNumber,
  speed,
  speedUnit,
  t,
  type Aircraft,
} from '@flightflow/shared';
import { CALLSIGN_RADIUS_KM, HOME_AIRPORT } from '../config';
import { classifyAircraft } from '../lib/aircraftIcon';
import { Chip } from './ui/Chip';
import { ArrowDownIcon, ArrowUpIcon, PlaneIcon } from './ui/icons';

interface Props {
  aircraft: Aircraft[];
  selectedHex: string | null;
  onSelect: (hex: string | null) => void;
}

type Filter = 'all' | 'pos' | 'near' | 'heli';
type SortKey = 'callsign' | 'alt' | 'speed' | 'dist';

interface Row {
  a: Aircraft;
  callsign: string;
  dist?: number;
  alt?: number;
  kind: ReturnType<typeof classifyAircraft>;
}

const GRID = 'grid grid-cols-[minmax(0,1fr)_56px_48px_52px] items-center gap-x-2';

function toRow(a: Aircraft): Row {
  const hasPos = typeof a.lat === 'number' && typeof a.lon === 'number';
  return {
    a,
    callsign: cleanCallsign(a.flight) || a.hex.toUpperCase(),
    dist: hasPos ? distanceKm(HOME_AIRPORT.lat, HOME_AIRPORT.lon, a.lat!, a.lon!) : undefined,
    alt: typeof a.alt_baro === 'number' ? a.alt_baro : a.alt_baro === 'ground' ? 0 : undefined,
    kind: classifyAircraft(a.t, a.category),
  };
}

// Los valores ausentes siempre van al final, sea cual sea el sentido.
function compare(key: SortKey, dir: 1 | -1) {
  return (x: Row, y: Row): number => {
    if (key === 'callsign') return dir * x.callsign.localeCompare(y.callsign);
    const vx = key === 'alt' ? x.alt : key === 'speed' ? x.a.gs : x.dist;
    const vy = key === 'alt' ? y.alt : key === 'speed' ? y.a.gs : y.dist;
    if (vx == null && vy == null) return 0;
    if (vx == null) return 1;
    if (vy == null) return -1;
    return dir * (vx - vy);
  };
}

export function TrafficList({ aircraft, selectedHex, onSelect }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'dist', dir: 1 });
  const selectedRef = useRef<HTMLButtonElement | null>(null);

  const rows = useMemo(() => aircraft.map(toRow), [aircraft]);

  const visible = useMemo(() => {
    const f = rows.filter((r) => {
      if (filter === 'pos') return r.dist != null;
      if (filter === 'near') return r.dist != null && r.dist < CALLSIGN_RADIUS_KM;
      if (filter === 'heli') return r.kind === 'heli';
      return true;
    });
    return f.sort(compare(sort.key, sort.dir));
  }, [rows, filter, sort]);

  // Si se selecciona desde el mapa o el buscador, la fila queda a la vista.
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedHex]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: key === 'callsign' ? 1 : key === 'dist' ? 1 : -1 }));

  const header = (key: SortKey, label: string, align: 'left' | 'right') => {
    const active = sort.key === key;
    return (
      <button
        type="button"
        onClick={() => toggleSort(key)}
        aria-label={t('map.sortBy', { col: label })}
        className={`flex items-center gap-0.5 text-[11px] font-semibold uppercase tracking-[0.07em] transition-colors ${
          align === 'right' ? 'justify-end' : ''
        } ${active ? 'text-[#007AFF] dark:text-[#0A84FF]' : 'text-gray-500 hover:text-gray-900 dark:text-[#8E8E93] dark:hover:text-white'}`}
      >
        {label}
        {active && (sort.dir === 1 ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />)}
      </button>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>{t('map.filter.all')}</Chip>
        <Chip active={filter === 'pos'} onClick={() => setFilter('pos')}>{t('map.filter.withPos')}</Chip>
        <Chip active={filter === 'near'} onClick={() => setFilter('near')}>{t('map.filter.nearby')}</Chip>
        <Chip active={filter === 'heli'} onClick={() => setFilter('heli')}>{t('map.filter.heli')}</Chip>
      </div>

      <div className={`${GRID} border-b border-black/5 px-2 pb-1.5 dark:border-white/10`}>
        {header('callsign', t('map.col.callsign'), 'left')}
        {header('alt', `${t('map.col.alt')} ${altitudeUnit()}`, 'right')}
        {header('speed', speedUnit(), 'right')}
        {header('dist', `${distanceUnit()}`, 'right')}
      </div>

      <div className="min-h-0 flex-1 no-scrollbar overflow-y-auto">
        {visible.map(({ a, callsign, dist, alt, kind }) => {
          const selected = selectedHex === a.hex;
          return (
            <button
              key={a.hex}
              ref={selected ? selectedRef : undefined}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(selected ? null : a.hex)}
              className={`${GRID} w-full rounded-lg px-2 py-2 text-left transition-colors ${
                selected
                  ? 'bg-[#007AFF]/10 dark:bg-[#0A84FF]/15'
                  : 'hover:bg-black/5 dark:hover:bg-white/[0.06]'
              }`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <PlaneIcon
                  className={`h-4 w-4 shrink-0 ${
                    selected ? 'text-[#FF9F0A]' : 'text-[#007AFF] dark:text-[#0A84FF]'
                  } ${kind === 'heli' ? 'opacity-60' : ''}`}
                />
                <span className="min-w-0">
                  <span
                    className={`block truncate text-sm font-semibold ${
                      selected ? 'text-[#007AFF] dark:text-[#0A84FF]' : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {callsign}
                  </span>
                  <span className="block truncate text-[11px] text-gray-500 dark:text-[#8E8E93]">
                    {a.r || '—'} · {a.t || a.category || '—'}
                  </span>
                </span>
              </span>
              <span className="text-right text-xs tabular-nums text-gray-700 dark:text-gray-300">
                {alt != null ? formatNumber(Math.round(altitude(alt).value)) : '—'}
              </span>
              <span className="text-right text-xs tabular-nums text-gray-700 dark:text-gray-300">
                {a.gs != null ? formatNumber(Math.round(speed(a.gs).value)) : '—'}
              </span>
              <span className="text-right text-xs tabular-nums text-gray-700 dark:text-gray-300">
                {dist != null ? formatNumber(distance(dist).value, 0) : '—'}
              </span>
            </button>
          );
        })}
        {visible.length === 0 && (
          <p className="px-2 py-6 text-center text-[13px] text-gray-500 dark:text-[#8E8E93]">
            {aircraft.length === 0 ? t('map.waiting') : t('map.empty.filtered')}
          </p>
        )}
      </div>
    </div>
  );
}
