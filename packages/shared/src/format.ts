// Number, unit and date formatting following ui.language and ui.units from config.yaml.
import { config } from './config';
import { locale, t } from './i18n';

export function formatNumber(v: number | null | undefined, digits = 0, minDigits = 0): string {
  if (v == null || Number.isNaN(v)) return '—';
  return v.toLocaleString(locale(), { maximumFractionDigits: digits, minimumFractionDigits: minDigits });
}

export function formatUtc(date: Date): string {
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm} UTC`;
}

export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
}

/** "12 Nov" style short date from a YYYY-MM-DD string. */
export function formatShortDate(isoDay: string): string {
  return new Date(isoDay + 'T00:00:00').toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
}

export function cleanCallsign(flight?: string | null): string {
  return (flight ?? '').trim();
}

// ── Units ───────────────────────────────────────────────────────────────────
// aviation: ft · kt · km   metric: m · km/h · km   imperial: ft · mph · mi

export interface Converted {
  value: number;
  unit: string;
}

export function altitude(ft: number): Converted {
  return config().units === 'metric' ? { value: ft * 0.3048, unit: 'm' } : { value: ft, unit: 'ft' };
}

export function speed(kt: number): Converted {
  switch (config().units) {
    case 'metric':
      return { value: kt * 1.852, unit: 'km/h' };
    case 'imperial':
      return { value: kt * 1.150779, unit: 'mph' };
    default:
      return { value: kt, unit: 'kt' };
  }
}

export function distance(km: number): Converted {
  return config().units === 'imperial' ? { value: km * 0.621371, unit: 'mi' } : { value: km, unit: 'km' };
}

export const altitudeUnit = () => altitude(0).unit;
export const speedUnit = () => speed(0).unit;
export const distanceUnit = () => distance(0).unit;

export function formatAltitude(ft: number | 'ground' | null | undefined): string {
  if (ft === 'ground') return t('common.ground');
  if (ft == null) return '—';
  const c = altitude(ft);
  return `${formatNumber(Math.round(c.value))} ${c.unit}`;
}

export function formatSpeed(kt: number | null | undefined): string {
  if (kt == null) return '—';
  const c = speed(kt);
  return `${formatNumber(Math.round(c.value))} ${c.unit}`;
}

export function formatDistance(km: number | null | undefined, digits = 1): string {
  if (km == null) return '—';
  const c = distance(km);
  return `${formatNumber(c.value, digits)} ${c.unit}`;
}

/** Convert a distance typed by the user in display units back to km. */
export function toKm(displayValue: number): number {
  return config().units === 'imperial' ? displayValue / 0.621371 : displayValue;
}
