import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { AltitudeBand, DailyPoint, FlightProfile, HourlyPoint } from '../api'
import { config, formatNumber, formatShortDate, t, useDarkMode } from '@flightflow/shared'

const PRIMARY = '#007AFF'
const ACCENT  = '#FF9F0A'

interface TooltipProps {
  active?: boolean
  payload?: { value: number; name: string }[]
  label?: string
}

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-3 py-2 text-xs shadow-xl">
      <div className="text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="font-semibold text-gray-900 dark:text-white">
          {formatNumber(p.value)}
        </div>
      ))}
    </div>
  )
}

interface DailyChartProps {
  data: DailyPoint[]
}

export function DailyAircraftChart({ data }: DailyChartProps) {
  const [dark] = useDarkMode('ff:dark-mode', true)
  const AXIS_COLOR = dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)'
  const GRID_COLOR = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
  const formatted = data.map((d) => ({
    ...d,
    label: formatShortDate(d.date),
  }))

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="label-caps mb-4">
        {t('an.chart.daily')}
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={formatted} barSize={6}>
          <XAxis
            dataKey="label"
            tick={{ fill: AXIS_COLOR, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: AXIS_COLOR, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: GRID_COLOR }} />
          <Bar dataKey="unique_aircraft" fill={PRIMARY} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Band label in the configured units: flight levels, or kilometres for metric. */
function bandLabel(b: AltitudeBand): string {
  if (config().units === 'metric') {
    const km = (ft: number) => formatNumber(ft * 0.0003048, 1, 1)
    if (b.min_ft == null) return `< ${km(b.max_ft!)} km`
    if (b.max_ft == null) return `> ${km(b.min_ft)} km`
    return `${km(b.min_ft)}–${km(b.max_ft)} km`
  }
  const fl = (ft: number) => String(Math.round(ft / 100)).padStart(3, '0')
  if (b.min_ft == null) return `< FL${fl(b.max_ft!)}`
  if (b.max_ft == null) return `> FL${fl(b.min_ft)}`
  return `FL${fl(b.min_ft)}-${fl(b.max_ft)}`
}

// Altitude band colors: low=muted blue → high=bright blue
const ALT_COLORS = [
  '#4A90D9',
  '#3A82D0',
  '#2B73C7',
  '#1C65BE',
  '#0D56B5',
  '#0048AC',
  '#003AA3',
]

interface AltitudeChartProps {
  data: AltitudeBand[]
}

export function AltitudeChart({ data }: AltitudeChartProps) {
  const [dark] = useDarkMode('ff:dark-mode', true)
  const AXIS_COLOR = dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)'
  const GRID_COLOR = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'

  // Reverse so highest altitude band appears at top
  const reversed = [...data].reverse().map((b) => ({ ...b, band: bandLabel(b) }))

  return (
    <div className="glass rounded-2xl p-5 h-full flex flex-col">
      <div className="flex flex-wrap items-baseline justify-between gap-y-1 mb-4">
        <h3 className="label-caps">{t('an.chart.altitudes')}</h3>
        <p className="text-xs text-gray-400 dark:text-gray-500">{t('an.chart.last30')}</p>
      </div>
      <div className="flex-1 min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={reversed} layout="vertical" barSize={14} margin={{ left: 8 }}>
          <XAxis
            type="number"
            tick={{ fill: AXIS_COLOR, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="band"
            width={80}
            tick={{ fill: AXIS_COLOR, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<AltitudeTooltip />}
            cursor={{ fill: GRID_COLOR }}
          />
          <Bar dataKey="flights" radius={[0, 3, 3, 0]}>
            {reversed.map((_, i) => (
              <Cell key={i} fill={ALT_COLORS[ALT_COLORS.length - 1 - i] ?? PRIMARY} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  )
}

function AltitudeTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-3 py-2 text-xs shadow-xl">
      <div className="text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className="font-semibold text-gray-900 dark:text-white">
        {t(`an.flights.${payload[0].value === 1 ? 'one' : 'other'}`, { n: formatNumber(payload[0].value) })}
      </div>
    </div>
  )
}

function ProfileTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-3 py-2 text-xs shadow-xl">
      <div className="text-gray-500 dark:text-gray-400 mb-1">{payload[0].name}</div>
      <div className="font-semibold text-gray-900 dark:text-white">
        {t(`an.flights.${payload[0].value === 1 ? 'one' : 'other'}`, { n: formatNumber(payload[0].value) })}
      </div>
    </div>
  )
}

const PROFILE_COLORS: Record<string, string> = {
  cruise:        PRIMARY,
  climb_descent: '#5856D6',
  regional:      ACCENT,
}

interface FlightProfileDonutProps {
  data: FlightProfile[]
}

export function FlightProfileDonut({ data: raw }: FlightProfileDonutProps) {
  const data = raw.map((d) => ({ ...d, label: t(`an.profile.${d.key}`) }))
  const total = data.reduce((s, d) => s + d.flights, 0)

  return (
    <div className="glass rounded-2xl p-5 h-full flex flex-col">
      <div className="flex flex-wrap items-baseline justify-between gap-y-1 mb-4">
        <h3 className="label-caps">{t('an.chart.profiles')}</h3>
        <p className="text-xs text-gray-400 dark:text-gray-500">{t('an.chart.last30')}</p>
      </div>
      <div className="flex flex-1 items-center gap-6">
        {/* Donut + total centrado */}
        <div className="relative shrink-0" style={{ width: 200, height: 200 }}>
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie
                data={data}
                dataKey="flights"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                strokeWidth={0}
                paddingAngle={2}
              >
                {data.map((entry) => (
                  <Cell key={entry.key} fill={PROFILE_COLORS[entry.key] ?? PRIMARY} />
                ))}
              </Pie>
              <Tooltip content={<ProfileTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              {formatNumber(total)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('an.flightsWord')}</span>
          </div>
        </div>

        {/* Leyenda con % y conteo */}
        <div className="flex flex-col gap-4 flex-1 min-w-0">
          {data.map((entry) => {
            const pct = total > 0 ? Math.round((entry.flights / total) * 100) : 0
            return (
              <div key={entry.key} className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: PROFILE_COLORS[entry.key] ?? PRIMARY }}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400 flex-1">
                  {entry.label}
                </span>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">
                    {pct}%
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-500">
                    {formatNumber(entry.flights)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface HourlyChartProps {
  data: HourlyPoint[]
}

export function HourlyActivityChart({ data }: HourlyChartProps) {
  const [dark] = useDarkMode('ff:dark-mode', true)
  const AXIS_COLOR = dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)'
  const filled = Array.from({ length: 24 }, (_, h) => {
    const found = data.find((d) => d.hour === h)
    return { hour: `${String(h).padStart(2, '0')}h`, count: found?.count ?? 0 }
  })

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="label-caps mb-4">
        {t('an.chart.hourly')}
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={filled}>
          <XAxis
            dataKey="hour"
            tick={{ fill: AXIS_COLOR, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval={3}
          />
          <YAxis
            tick={{ fill: AXIS_COLOR, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="count"
            stroke={ACCENT}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: ACCENT }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
