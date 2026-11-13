// Runtime configuration, served by the collector at /api/config from config.yaml.
// Apps call loadConfig() before rendering; changing config.yaml needs no rebuild.
import { setLanguage, type Language } from './i18n';

export type Units = 'aviation' | 'metric' | 'imperial';

export interface PublicConfig {
  version: string;
  language: Language;
  units: Units;
  receiver: { lat: number; lon: number; mock: boolean };
  home_airport: { icao: string; name: string | null; lat: number | null; lon: number | null } | null;
  nearby_radius_km: number;
  airline_logos: boolean;
  services: { collector: boolean; map: boolean; analytics: boolean; portrait: boolean };
  map: { style_url: string; metar: boolean; callsign_radius_km: number };
  portrait: { default_radius_km: number; max_planes: number };
}

export const DEFAULT_CONFIG: PublicConfig = {
  version: 'dev',
  language: 'en',
  units: 'aviation',
  receiver: { lat: 0, lon: 0, mock: false },
  home_airport: null,
  nearby_radius_km: 150,
  airline_logos: false,
  services: { collector: true, map: true, analytics: true, portrait: true },
  map: { style_url: 'https://tiles.openfreemap.org/styles/positron', metar: false, callsign_radius_km: 50 },
  portrait: { default_radius_km: 40, max_planes: 3 },
};

let current: PublicConfig = DEFAULT_CONFIG;

/** The loaded configuration (DEFAULT_CONFIG until loadConfig resolves). */
export function config(): PublicConfig {
  return current;
}

/** Fetch /api/config. Throws if the collector is unreachable: the apps need it to know where they are. */
export async function loadConfig(): Promise<PublicConfig> {
  const res = await fetch('/api/config', { cache: 'no-store' });
  if (!res.ok) throw new Error(`/api/config HTTP ${res.status}`);
  const data = (await res.json()) as Partial<PublicConfig>;
  current = { ...DEFAULT_CONFIG, ...data } as PublicConfig;
  // ?lang=es in the URL overrides the configured language (handy for testing).
  const q = new URLSearchParams(window.location.search).get('lang');
  setLanguage(q === 'en' || q === 'es' ? q : current.language);
  document.documentElement.lang = q === 'en' || q === 'es' ? q : current.language;
  return current;
}
