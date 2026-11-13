import { useEffect, useState } from 'react'
import { formatDistance, formatShortDate, t } from '@flightflow/shared'
import { api, type AltitudeBand, type FlightProfile, type OverviewData } from '../api'
import { AltitudeChart, DailyAircraftChart, FlightProfileDonut, HourlyActivityChart } from '../components/Charts'
import { MetricWidget } from '../components/MetricWidget'
import { TopAirlinesWidget } from '../components/TopAirlinesWidget'
import { TopModelsWidget } from '../components/TopModelsWidget'

export function Overview() {
  const [data, setData]           = useState<OverviewData | null>(null)
  const [altitudes, setAltitudes] = useState<AltitudeBand[]>([])
  const [profiles, setProfiles]   = useState<FlightProfile[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([api.overview(), api.altitudes()])
      .then(([overview, alt]) => {
        setData(overview)
        setAltitudes(alt.bands)
        setProfiles(alt.profiles)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (error) {
    return (
      <div className="glass rounded-2xl p-6 text-red-400 text-sm">
        {t('an.error', { msg: error })}
      </div>
    )
  }

  const kpis = data?.kpis
  const latestDate = data?.latest_date ?? undefined
  const dateBadge = latestDate ? formatShortDate(latestDate) : undefined
  const maxDist = kpis?.max_distance_km.value != null ? formatDistance(kpis.max_distance_km.value, 0).split(' ') : null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('an.nav.overview')}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-500 mt-1">
          {t('an.overview.subtitle')}{dateBadge ? ` (${dateBadge})` : ''}
        </p>
      </div>

      {/* Widget grid — 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <MetricWidget
          title={t('an.kpi.aircraft')}
          value={kpis?.aircraft_today.value ?? null}
          change={
            kpis?.aircraft_today.change_pct != null
              ? { value: kpis.aircraft_today.change_pct, period: t(`an.period.${kpis.aircraft_today.period}`) }
              : null
          }
          loading={loading}
          icon={<PlaneIcon />}
        />

        <MetricWidget
          title={t('an.kpi.flights7d')}
          value={kpis?.flights_7d.value ?? null}
          change={
            kpis?.flights_7d.change_pct != null
              ? { value: kpis.flights_7d.change_pct, period: t(`an.period.${kpis.flights_7d.period}`) }
              : null
          }
          loading={loading}
        />

        <MetricWidget
          title={t('an.kpi.busiestHour')}
          value={
            kpis?.busiest_hour.value != null
              ? `${String(kpis.busiest_hour.value).padStart(2, '0')}:00`
              : null
          }
          loading={loading}
          icon={<ClockIcon />}
        />

        <MetricWidget
          title={t('an.kpi.maxDistance')}
          value={maxDist ? maxDist[0] : null}
          unit={maxDist ? maxDist[1] : undefined}
          loading={loading}
          icon={<RadarIcon />}
        />
      </div>

      {/* Charts + Top Airlines */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
        <div className="md:col-span-2">
          <DailyAircraftChart data={data?.daily_aircraft ?? []} />
        </div>
        <div className="md:col-span-2">
          <HourlyActivityChart data={data?.hourly_activity ?? []} />
        </div>
        <TopAirlinesWidget
          airlines={data?.top_airlines ?? []}
          loading={loading}
          date={latestDate}
        />
        <TopModelsWidget
          models={data?.top_models ?? []}
          loading={loading}
          date={latestDate}
        />
        <div className="md:col-span-2 flex flex-col min-h-[320px]">
          <AltitudeChart data={altitudes} />
        </div>
        <div className="md:col-span-2 flex flex-col min-h-[320px]">
          <FlightProfileDonut data={profiles} />
        </div>
      </div>
    </div>
  )
}

function PlaneIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2h-1A1.5 1.5 0 0 0 9 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L12 19v-5.5L21 16Z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function RadarIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2a10 10 0 1 0 10 10" />
      <path d="M12 6a6 6 0 0 0 0 12" />
      <path d="M12 12 19.07 4.93" />
    </svg>
  )
}
