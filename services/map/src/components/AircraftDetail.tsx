import {
  bearing,
  cleanCallsign,
  distanceKm,
  formatAltitude,
  formatDistance,
  formatNumber,
  formatSpeed,
  t,
  type Aircraft,
  type AircraftInfo,
} from '@flightflow/shared';
import { HOME_AIRPORT } from '../config';

interface Props {
  aircraft: Aircraft;
  info: AircraftInfo | null;
  trailLength: number;
  onClose: () => void;
}


function fmtCoord(v: number | undefined, axis: 'lat' | 'lon'): string {
  if (v === undefined) return '—';
  const abs = Math.abs(v);
  const dir = axis === 'lat' ? (v >= 0 ? 'N' : 'S') : (v >= 0 ? 'E' : 'W');
  return `${abs.toFixed(4)}° ${dir}`;
}

function fmtSeen(s: number | undefined): string {
  if (s === undefined) return '—';
  return s < 10 ? `${s.toFixed(1)} s` : `${Math.round(s)} s`;
}

const CATEGORIES = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'B1', 'B2', 'B3', 'B4', 'B6', 'B7'];

export function AircraftDetail({ aircraft, info, trailLength, onClose }: Props) {
  const callsign = cleanCallsign(aircraft.flight) || aircraft.hex.toUpperCase();
  const reg = aircraft.r || info?.registration || '—';
  const type = aircraft.t || info?.fullType || info?.icaoType || '—';
  const hasPos = typeof aircraft.lat === 'number' && typeof aircraft.lon === 'number';

  const dist = hasPos
    ? distanceKm(HOME_AIRPORT.lat, HOME_AIRPORT.lon, aircraft.lat!, aircraft.lon!)
    : undefined;
  const brg = hasPos
    ? bearing(HOME_AIRPORT.lat, HOME_AIRPORT.lon, aircraft.lat!, aircraft.lon!)
    : undefined;

  const heading = aircraft.track ?? aircraft.true_heading ?? aircraft.mag_heading;
  const categoryDesc =
    aircraft.category && CATEGORIES.includes(aircraft.category) ? t(`cat.${aircraft.category}`) : undefined;

  return (
    <div className="flex flex-col gap-4 px-1">
      {/* Header con back button */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onClose}
          aria-label={t('map.detail.back')}
          className="glass-inset flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full transition hover:brightness-110"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-[18px] w-[18px] text-ink-tab dark:text-slate-300"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[24px] font-bold leading-tight text-ink-accent dark:text-[#9ab8ff]">
            {callsign}
          </p>
          <p className="truncate text-[13px] font-medium text-ink-muted dark:text-slate-400">
            {reg} · {type}
          </p>
        </div>
      </div>

      {/* Grid de métricas principales */}
      <div className="grid grid-cols-2 gap-2">
        <Metric label={t('map.detail.altitude')} value={formatAltitude(aircraft.alt_baro)} />
        <Metric label={t('map.detail.speed')} value={formatSpeed(aircraft.gs)} />
        <Metric label={t('map.detail.heading')} value={heading != null ? `${Math.round(heading)}°` : '—'} />
        <Metric label={t('map.detail.squawk')} value={aircraft.squawk ?? '—'} mono />
        <Metric
          label={t('map.detail.distanceTo', { place: HOME_AIRPORT.icao || 'RX' })}
          value={formatDistance(dist)}
        />
        <Metric label={t('map.detail.bearing')} value={brg != null ? `${Math.round(brg)}°` : '—'} />
      </div>

      {/* Posición */}
      <Section title={t('map.detail.position')}>
        <Row label={t('map.detail.latitude')} value={fmtCoord(aircraft.lat, 'lat')} mono />
        <Row label={t('map.detail.longitude')} value={fmtCoord(aircraft.lon, 'lon')} mono />
        {aircraft.alt_geom !== undefined && (
          <Row label={t('map.detail.geomAlt')} value={formatAltitude(aircraft.alt_geom)} />
        )}
      </Section>

      {/* Técnica */}
      <Section title={t('map.detail.technical')}>
        {info?.manufacturer && <Row label={t('map.detail.manufacturer')} value={info.manufacturer} />}
        {info?.operator && <Row label={t('map.detail.operator')} value={info.operator} />}
        <Row label={t('map.detail.hex')} value={aircraft.hex.toUpperCase()} mono />
        {categoryDesc && <Row label={t('map.detail.category')} value={`${aircraft.category} · ${categoryDesc}`} />}
      </Section>

      {/* Señal */}
      <Section title={t('map.detail.signal')}>
        <Row label={t('map.detail.messages')} value={formatNumber(aircraft.messages)} mono />
        {aircraft.rssi !== undefined && (
          <Row label="RSSI" value={`${aircraft.rssi.toFixed(1)} dBFS`} mono />
        )}
        <Row label={t('map.detail.lastUpdate')} value={fmtSeen(aircraft.seen)} mono />
        {aircraft.seen_pos !== undefined && (
          <Row label={t('map.detail.lastPosition')} value={fmtSeen(aircraft.seen_pos)} mono />
        )}
      </Section>

      {/* Trayectoria */}
      <Section title={t('map.detail.trail')}>
        <Row
          label={t('map.detail.points')}
          value={trailLength > 0 ? `${trailLength}` : t('map.detail.waitingMove')}
        />
      </Section>
    </div>
  );
}

// ─── Subcomponentes ──────────────────────────────────────────────────────────
function Metric({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="glass-inset rounded-[12px] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">
        {label}
      </p>
      <p
        className={`mt-0.5 text-[18px] font-bold text-ink-tab dark:text-white ${
          mono ? 'tabular-nums' : ''
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">
        {title}
      </p>
      <div className="glass-inset flex flex-col rounded-[12px] px-3 py-2">{children}</div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 text-[13px]">
      <span className="text-ink-muted dark:text-slate-400">{label}</span>
      <span
        className={`font-semibold text-ink-tab dark:text-white ${mono ? 'tabular-nums' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}
