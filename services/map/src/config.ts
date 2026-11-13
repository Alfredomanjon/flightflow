// Map settings derived from the collector's /api/config (config.yaml) once it is loaded.
// The `export let` values are live bindings: components read them at render time.
import { config, t } from '@flightflow/shared';
import { findAirport } from './data/airports';

export const REFRESH_MS = 1000;
export const STATS_REFRESH_MS = 5_000;
export const METAR_REFRESH_MS = 5 * 60 * 1000;
export const ONLINE_TIMEOUT_MS = 5_000;

export interface HomePoint {
  /** ICAO code, or '' when no home airport is configured (the receiver is used instead). */
  icao: string;
  name: string;
  lat: number;
  lon: number;
}

export let HOME_AIRPORT: HomePoint = { icao: '', name: '', lat: 0, lon: 0 };
export let RECEIVER = { lat: 0, lon: 0 };
export let NEARBY_RADIUS_KM = 150;
export let CALLSIGN_RADIUS_KM = 50;
export let MAP_STYLE = '';
export let METAR_ENABLED = false;

/** Call after loadConfig() and loadAirports(). */
export function initMapConfig(): void {
  const cfg = config();
  RECEIVER = { lat: cfg.receiver.lat, lon: cfg.receiver.lon };
  const home = cfg.home_airport;
  if (home) {
    const known = findAirport(home.icao);
    HOME_AIRPORT = {
      icao: home.icao,
      name: home.name ?? known?.name ?? home.icao,
      lat: home.lat ?? known?.lat ?? RECEIVER.lat,
      lon: home.lon ?? known?.lon ?? RECEIVER.lon,
    };
  } else {
    HOME_AIRPORT = { icao: '', name: t('map.receiver'), lat: RECEIVER.lat, lon: RECEIVER.lon };
  }
  NEARBY_RADIUS_KM = cfg.nearby_radius_km;
  CALLSIGN_RADIUS_KM = cfg.map.callsign_radius_km;
  MAP_STYLE = cfg.map.style_url;
  METAR_ENABLED = cfg.map.metar;
}
