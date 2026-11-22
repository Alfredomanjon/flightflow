import { useMemo } from 'react';
import {
  cleanCallsign,
  distanceKm,
  formatDistance,
  formatNumber,
  formatUtc,
  speed,
  speedUnit,
  t,
  type Aircraft,
  type Metar,
} from '@flightflow/shared';
import type { Airport } from '../data/airports';
import { ChevronLeftIcon, LocateIcon, PlaneIcon } from './ui/icons';

interface Props {
  airport: Airport;
  isHome: boolean;
  metar: Metar | null;
  aircraft: Aircraft[];
  onClose: () => void;
  onCenter: () => void;
  onSelect: (hex: string) => void;
}

const RADIUS_KM = 20;
const LOW_FT = 3000;

export function AirportPanel({ airport, isHome, metar, aircraft, onClose, onCenter, onSelect }: Props) {
  const near = useMemo(
    () =>
      aircraft
        .filter((a) => typeof a.lat === 'number' && typeof a.lon === 'number')
        .map((a) => ({ a, d: distanceKm(airport.lat, airport.lon, a.lat!, a.lon!) }))
        .filter(({ d }) => d <= RADIUS_KM)
        .sort((x, y) => x.d - y.d),
    [aircraft, airport],
  );
  const onGround = near.filter(({ a }) => a.alt_baro === 'ground').length;
  const low = near.filter(({ a }) => typeof a.alt_baro === 'number' && a.alt_baro < LOW_FT).length;

  const wind = (() => {
    if (!metar || metar.wspd == null) return '—';
    if (metar.wspd === 0) return t('map.airport.calm');
    const s = Math.round(speed(metar.wspd).value);
    const dir = typeof metar.wdir === 'number' ? `${String(Math.round(metar.wdir)).padStart(3, '0')}°` : t('map.airport.variable');
    return `${dir} · ${s} ${speedUnit()}`;
  })();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={onClose}
          aria-label={t('map.detail.back')}
          title={t('map.detail.back')}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-900 dark:text-[#8E8E93] dark:hover:bg-white/8 dark:hover:text-white"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-2xl font-semibold leading-tight text-gray-900 dark:text-white">{airport.icao}</p>
          <p className="truncate text-xs text-gray-500 dark:text-[#8E8E93]">
            {airport.name}
            {airport.iata ? ` · ${airport.iata}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onCenter}
          className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-[#007AFF]/10 px-2.5 text-xs font-medium text-[#007AFF] transition-colors hover:bg-[#007AFF]/15 dark:bg-[#0A84FF]/15 dark:text-[#0A84FF]"
        >
          <LocateIcon className="h-3.5 w-3.5" />
          {t('map.airport.center')}
        </button>
      </div>

      {/* Meteorología (el METAR solo existe para el aeropuerto base) */}
      <section>
        <p className="label-caps mb-2">{t('map.airport.weather')}</p>
        {isHome && metar ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Tile label={t('map.airport.wind')} value={wind} />
              <Tile
                label={t('map.airport.temp')}
                value={metar.temp != null ? `${formatNumber(metar.temp)}° / ${formatNumber(metar.dewpoint)}°` : '—'}
              />
              <Tile label={t('map.airport.qnh')} value={metar.altim != null ? `${formatNumber(metar.altim)} hPa` : '—'} />
              <Tile label={t('map.airport.observed')} value={metar.observedAt ? formatUtc(new Date(metar.observedAt)) : '—'} />
            </div>
            <p className="mt-2 break-words rounded-xl bg-black/[0.04] px-3 py-2 font-mono text-[11px] leading-relaxed text-gray-600 dark:bg-white/[0.06] dark:text-gray-300">
              {metar.raw}
            </p>
          </>
        ) : (
          <p className="text-[13px] text-gray-500 dark:text-[#8E8E93]">{t('map.airport.noMetar')}</p>
        )}
      </section>

      {/* Tráfico cercano */}
      <section>
        <p className="label-caps mb-2">{t('map.airport.traffic')}</p>
        <div className="grid grid-cols-3 gap-2">
          <Tile label={t('map.airport.within', { km: RADIUS_KM })} value={formatNumber(near.length)} compact />
          <Tile label={t('map.airport.onGround')} value={formatNumber(onGround)} compact />
          <Tile label={t('map.airport.low')} value={formatNumber(low)} compact />
        </div>
      </section>

      {near.length > 0 && (
        <section>
          <p className="label-caps mb-1">{t('map.airport.closest')}</p>
          {near.slice(0, 6).map(({ a, d }) => (
            <button
              key={a.hex}
              type="button"
              onClick={() => onSelect(a.hex)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/[0.06]"
            >
              <PlaneIcon className="h-4 w-4 shrink-0 text-[#007AFF] dark:text-[#0A84FF]" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {cleanCallsign(a.flight) || a.hex.toUpperCase()}
              </span>
              <span className="ml-auto text-xs tabular-nums text-gray-500 dark:text-[#8E8E93]">{formatDistance(d)}</span>
            </button>
          ))}
        </section>
      )}
    </div>
  );
}

function Tile({ label, value, compact }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className="rounded-xl bg-black/[0.04] px-3 py-2.5 dark:bg-white/[0.06]">
      <p className="label-caps leading-tight">{label}</p>
      <p className={`mt-1 font-semibold tabular-nums text-gray-900 dark:text-white ${compact ? 'text-xl' : 'text-base'}`}>
        {value}
      </p>
    </div>
  );
}
