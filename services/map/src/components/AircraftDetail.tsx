import { useEffect, useRef, useState } from 'react';
import {
  AircraftArt,
  airlineCode,
  bearing,
  cleanCallsign,
  distanceKm,
  formatAltitude,
  formatDistance,
  formatNumber,
  formatSpeed,
  getAirline,
  t,
  type Aircraft,
  type AircraftInfo,
} from '@flightflow/shared';
import { HOME_AIRPORT } from '../config';
import { AirlineMark } from './AirlineMark';
import { Accordion } from './ui/Accordion';
import { CloseIcon, FollowIcon, LinkIcon } from './ui/icons';

interface Props {
  aircraft: Aircraft;
  info: AircraftInfo | null;
  trailLength: number;
  following: boolean;
  onToggleFollow: () => void;
  onClose: () => void;
}

function fmtCoord(v: number | undefined, axis: 'lat' | 'lon'): string {
  if (v === undefined) return '—';
  const abs = Math.abs(v);
  const dir = axis === 'lat' ? (v >= 0 ? 'N' : 'S') : v >= 0 ? 'E' : 'W';
  return `${abs.toFixed(4)}° ${dir}`;
}

function fmtSeen(s: number | undefined): string {
  if (s === undefined) return '—';
  return s < 10 ? `${s.toFixed(1)} s` : `${Math.round(s)} s`;
}

const CATEGORIES = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'B1', 'B2', 'B3', 'B4', 'B6', 'B7'];

export function AircraftDetail({ aircraft, info, trailLength, following, onToggleFollow, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | null>(null);
  useEffect(() => () => {
    if (copyTimer.current != null) window.clearTimeout(copyTimer.current);
  }, []);

  const callsign = cleanCallsign(aircraft.flight) || aircraft.hex.toUpperCase();
  const reg = aircraft.r || info?.registration || '—';
  const type = info?.fullType || aircraft.t || info?.icaoType || '—';
  const hasPos = typeof aircraft.lat === 'number' && typeof aircraft.lon === 'number';

  const code = airlineCode(callsign);
  const airline = code ? getAirline(code) : null;
  const operator = airline?.name ?? info?.operator;

  const dist = hasPos ? distanceKm(HOME_AIRPORT.lat, HOME_AIRPORT.lon, aircraft.lat!, aircraft.lon!) : undefined;
  const brg = hasPos ? bearing(HOME_AIRPORT.lat, HOME_AIRPORT.lon, aircraft.lat!, aircraft.lon!) : undefined;
  const heading = aircraft.track ?? aircraft.true_heading ?? aircraft.mag_heading;
  const categoryDesc =
    aircraft.category && CATEGORIES.includes(aircraft.category) ? t(`cat.${aircraft.category}`) : undefined;

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      if (copyTimer.current != null) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* portapapeles no disponible: sin acción */
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Cabecera */}
      <div className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {code && <AirlineMark code={code} size="40px" />}
          <div className="min-w-0">
            <p className="truncate text-2xl font-semibold leading-tight text-gray-900 dark:text-white">{callsign}</p>
            <p className="truncate text-xs text-gray-500 dark:text-[#8E8E93]">
              {operator ? `${operator} · ` : ''}
              {reg} · {type}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('map.detail.close')}
          title={`${t('map.detail.close')} (Esc)`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-900 dark:text-[#8E8E93] dark:hover:bg-white/8 dark:hover:text-white"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Acciones */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onToggleFollow}
          aria-pressed={following}
          disabled={!hasPos}
          className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 ${
            following
              ? 'bg-[#007AFF] text-white dark:bg-[#0A84FF]'
              : 'bg-[#007AFF]/10 text-[#007AFF] hover:bg-[#007AFF]/15 dark:bg-[#0A84FF]/15 dark:text-[#0A84FF]'
          }`}
        >
          <FollowIcon className="h-4 w-4" />
          {following ? t('map.detail.following') : t('map.detail.follow')}
        </button>
        <button
          type="button"
          onClick={share}
          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-black/10 text-sm font-medium text-gray-700 transition-colors hover:bg-black/5 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/8"
        >
          <LinkIcon className="h-4 w-4" />
          <span aria-live="polite">{copied ? t('map.detail.copied') : t('map.detail.share')}</span>
        </button>
      </div>

      {/* Silueta del aparato */}
      <div
        className="flex h-32 items-center justify-center rounded-xl bg-black/[0.04] px-3 text-[#007AFF] dark:bg-white/[0.06] dark:text-[#0A84FF]"
      >
        <AircraftArt type={aircraft.t || info?.icaoType} category={aircraft.category} className="h-auto max-h-28 w-full" title={type} />
      </div>

      {/* Métricas clave */}
      <div className="grid grid-cols-2 gap-2">
        <Metric label={t('map.detail.altitude')} value={formatAltitude(aircraft.alt_baro)} />
        <Metric label={t('map.detail.speed')} value={formatSpeed(aircraft.gs)} />
        <Metric label={t('map.detail.heading')} value={heading != null ? `${Math.round(heading)}°` : '—'} />
        <Metric
          label={t('map.detail.distanceTo', { place: HOME_AIRPORT.icao || 'RX' })}
          value={formatDistance(dist)}
        />
      </div>

      {/* Acordeones */}
      <div>
        <Accordion title={t('map.detail.position')} defaultOpen>
          <Row label={t('map.detail.latitude')} value={fmtCoord(aircraft.lat, 'lat')} mono />
          <Row label={t('map.detail.longitude')} value={fmtCoord(aircraft.lon, 'lon')} mono />
          {aircraft.alt_geom !== undefined && (
            <Row label={t('map.detail.geomAlt')} value={formatAltitude(aircraft.alt_geom)} />
          )}
          <Row label={t('map.detail.bearing')} value={brg != null ? `${Math.round(brg)}°` : '—'} mono />
        </Accordion>
        <Accordion title={t('map.detail.technical')}>
          {info?.manufacturer && <Row label={t('map.detail.manufacturer')} value={info.manufacturer} />}
          {operator && <Row label={t('map.detail.operator')} value={operator} />}
          <Row label={t('map.detail.squawk')} value={aircraft.squawk ?? '—'} mono />
          <Row label={t('map.detail.hex')} value={aircraft.hex.toUpperCase()} mono />
          {categoryDesc && <Row label={t('map.detail.category')} value={`${aircraft.category} · ${categoryDesc}`} />}
        </Accordion>
        <Accordion title={t('map.detail.signal')}>
          <Row label={t('map.detail.messages')} value={formatNumber(aircraft.messages)} mono />
          {aircraft.rssi !== undefined && <Row label="RSSI" value={`${aircraft.rssi.toFixed(1)} dBFS`} mono />}
          <Row label={t('map.detail.lastUpdate')} value={fmtSeen(aircraft.seen)} mono />
          {aircraft.seen_pos !== undefined && (
            <Row label={t('map.detail.lastPosition')} value={fmtSeen(aircraft.seen_pos)} mono />
          )}
        </Accordion>
        <Accordion title={t('map.detail.trail')}>
          <Row
            label={t('map.detail.points')}
            value={trailLength > 0 ? `${trailLength}` : t('map.detail.waitingMove')}
          />
        </Accordion>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/[0.04] px-3 py-2.5 dark:bg-white/[0.06]">
      <p className="label-caps">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 text-[13px]">
      <span className="text-gray-500 dark:text-[#8E8E93]">{label}</span>
      <span className={`text-right font-medium text-gray-900 dark:text-white ${mono ? 'tabular-nums' : ''}`}>
        {value}
      </span>
    </div>
  );
}
