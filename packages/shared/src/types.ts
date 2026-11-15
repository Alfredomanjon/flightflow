/** One aircraft as reported by readsb/tar1090 (aircraft.json). */
export interface Aircraft {
  hex: string;
  flight?: string;
  /** Registration (tar1090 database). */
  r?: string;
  /** ICAO type designator (tar1090 database). */
  t?: string;
  /** Source of the position: adsb_icao, mlat, tisb_other… */
  type?: string;
  category?: string;
  lat?: number;
  lon?: number;
  alt_baro?: number | 'ground';
  alt_geom?: number;
  /** Vertical rate in ft/min (negative = descending). */
  baro_rate?: number;
  geom_rate?: number;
  gs?: number;
  track?: number;
  true_heading?: number;
  mag_heading?: number;
  squawk?: string;
  seen?: number;
  seen_pos?: number;
  rssi?: number;
  messages?: number;
}

export interface AircraftResponse {
  now: number;
  messages: number;
  aircraft: Aircraft[];
}

export interface StatsWindow {
  start?: number;
  end?: number;
  local?: {
    samples_processed?: number;
    modeac?: number;
    modes?: number;
    bad?: number;
    unknown_icao?: number;
    accepted?: number[];
  };
  remote?: { accepted?: number[] };
  cpr?: Record<string, number>;
  tracks?: Record<string, number>;
  messages?: number;
}

export interface StatsResponse {
  now: number;
  gain_db?: number;
  estimated_ppm?: number;
  aircraft_with_pos?: number;
  aircraft_without_pos?: number;
  aircraft_count_by_type?: Record<string, number>;
  last1min?: StatsWindow;
  last5min?: StatsWindow;
  last15min?: StatsWindow;
  total?: StatsWindow;
}

export interface Metar {
  icao: string;
  raw: string;
  observedAt?: string;
  temp?: number;
  dewpoint?: number;
  wdir?: number | string;
  wspd?: number;
  altim?: number;
}
