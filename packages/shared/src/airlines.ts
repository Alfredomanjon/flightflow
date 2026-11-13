import data from './data/airlines.json';
import { config } from './config';

export interface AirlineInfo {
  name: string;
  /** Brand colour for the badge shown when there is no logo. */
  color: string;
  iata?: string;
}

const AIRLINES = data as Record<string, AirlineInfo>;

/** Airline by ICAO callsign prefix (RYR, IBE…). */
export function getAirline(code: string): AirlineInfo | null {
  return AIRLINES[code] ?? null;
}

/** ICAO airline prefix of a callsign such as RYR42KP, or null for registrations. */
export function airlineCode(callsign: string): string | null {
  const m = /^([A-Z]{3})\d/.exec(callsign);
  return m ? m[1] : null;
}

/** Deterministic colour for airlines without a known brand colour. */
export function fallbackColor(code: string): string {
  const palette = ['#4F46E5', '#0891B2', '#059669', '#D97706', '#DC2626', '#7C3AED', '#DB2777'];
  let hash = 0;
  for (const c of code) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return palette[hash % palette.length];
}

/** Readable text colour (dark or white) over a brand colour. */
export function badgeTextColor(color: string): string {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#1f2937' : '#ffffff';
}

/** URL of the airline logo, or null when logos are disabled (airline_logos: false). */
export function logoUrl(code: string): string | null {
  return config().airline_logos ? `/logos/${code}.png` : null;
}
