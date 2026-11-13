const BASE = '/api'

async function get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(BASE + path, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
    })
  }
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json()
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface KPI {
  value: number | null
  change_pct?: number | null
  period?: string
}

export interface DailyPoint {
  date: string
  unique_aircraft: number
  total_positions: number
}

export interface HourlyPoint {
  hour: number
  count: number
}

export interface AirlineEntry {
  code: string
  count: number
}

export interface ModelEntry {
  type: string
  count: number
}

export interface OverviewData {
  latest_date: string | null
  kpis: {
    aircraft_today: KPI
    flights_7d: KPI
    busiest_hour: KPI
    max_distance_km: KPI
  }
  daily_aircraft: DailyPoint[]
  hourly_activity: HourlyPoint[]
  top_airlines: AirlineEntry[]
  top_models: ModelEntry[]
}

export interface Flight {
  id: number
  date: string
  hex: string
  flight: string | null
  reg: string | null
  type: string | null
  category: string | null
  first_seen: string | null
  last_seen: string | null
  duration_min: number | null
  detection_count: number
  min_distance_km: number | null
  max_distance_km: number | null
  min_alt_baro: number | null
  max_alt_baro: number | null
  avg_gs: number | null
  max_gs: number | null
  avg_rssi: number | null
}

export interface PagedResponse<T> {
  total: number
  page: number
  limit: number
  pages: number
  items: T[]
}

export interface CompactEntry {
  date: string
  unique_aircraft: number
  total_positions: number
  busiest_hour: number | null
  max_distance_km: number | null
}

export interface ServiceData {
  last_insert_ts: string | null
  positions_today: number
  compact_history: CompactEntry[]
}

export interface AltitudeBand {
  key: string
  min_ft: number | null
  max_ft: number | null
  flights: number
}

export interface FlightProfile {
  key: 'cruise' | 'climb_descent' | 'regional'
  flights: number
}

export interface AltitudesData {
  from_date: string
  to_date: string
  bands: AltitudeBand[]
  profiles: FlightProfile[]
}

export interface Aircraft {
  hex: string
  reg: string | null
  type: string | null
  appearances: number
  first_date: string
  last_date: string
  avg_max_alt: number | null
  closest_km: number | null
}

// ── API calls ────────────────────────────────────────────────────────────────

export const api = {
  overview: (from_date?: string, to_date?: string) =>
    get<OverviewData>('/overview', { from_date, to_date }),

  flights: (params: {
    from_date?: string
    to_date?: string
    hex?: string
    flight?: string
    reg?: string
    type?: string
    page?: number
    limit?: number
  }) => get<PagedResponse<Flight>>('/flights', params),

  altitudes: (from_date?: string, to_date?: string) =>
    get<AltitudesData>('/altitudes', { from_date, to_date }),

  aircraft: (page = 1, limit = 50) =>
    get<PagedResponse<Aircraft>>('/aircraft', { page, limit }),

  today: () =>
    get<{ count: number; items: unknown[] }>('/today'),

  service: () =>
    get<ServiceData>('/service'),

  health: () =>
    get<{ status: string }>('/health'),
}
