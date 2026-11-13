import { useEffect, useState } from 'react'
import { formatDistance, formatNumber, locale, t } from '@flightflow/shared'
import { api, type ServiceData } from '../api'

function timeAgo(isoTs: string): string {
  const ts = isoTs.includes('+') || isoTs.endsWith('Z') ? isoTs : isoTs + 'Z'
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (isNaN(diff) || diff < 0) return t('an.ago.now')
  if (diff < 60)   return t('an.ago.s', { n: diff })
  if (diff < 3600) return t('an.ago.min', { n: Math.floor(diff / 60) })
  return t('an.ago.h', { n: Math.floor(diff / 3600) })
}

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString(locale(), {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
      ok
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
        : 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
      {ok ? t('an.status.active') : t('an.status.noRecent')}
    </span>
  )
}

export function Service() {
  const [data, setData]       = useState<ServiceData | null>(null)
  const [apiOk, setApiOk]     = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [, setTick] = useState(0)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.service().then(setData).catch((e: Error) => setError(e.message)),
      api.health().then(() => setApiOk(true)).catch(() => setApiOk(false)),
    ]).finally(() => setLoading(false))
  }, [])

  // Refresca el "hace Xs" cada 5s sin volver a llamar a la API
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5000)
    return () => clearInterval(id)
  }, [])

  // ETL activo si el último insert fue hace menos de 2 minutos
  const normalizeTs = (ts: string) =>
    ts.includes('+') || ts.endsWith('Z') ? ts : ts + 'Z'
  const etlActive =
    data?.last_insert_ts != null &&
    Date.now() - new Date(normalizeTs(data.last_insert_ts)).getTime() < 120_000

  if (error) {
    return (
      <div className="glass rounded-2xl p-6 text-red-400 text-sm">
        {t('an.error', { msg: error })}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('an.status.title')}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-500 mt-1">{t('an.status.subtitle')}</p>
      </div>

      {/* Estado general */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {/* API */}
        <div className="glass rounded-2xl p-5 flex flex-col gap-2">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-widest">
            API
          </span>
          {loading ? (
            <div className="h-6 w-20 rounded-lg bg-gray-200 dark:bg-white/5 animate-pulse" />
          ) : (
            <StatusBadge ok={apiOk === true} />
          )}
          <span className="text-xs text-gray-400 dark:text-gray-500">FastAPI / uvicorn</span>
        </div>

        {/* ETL insert loop */}
        <div className="glass rounded-2xl p-5 flex flex-col gap-2">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-widest">
            {t('an.status.insertLoop')}
          </span>
          {loading ? (
            <div className="h-6 w-28 rounded-lg bg-gray-200 dark:bg-white/5 animate-pulse" />
          ) : (
            <StatusBadge ok={etlActive} />
          )}
          {data?.last_insert_ts && (
            <span className="text-xs text-gray-400 dark:text-gray-500" suppressHydrationWarning>
              {t('an.status.lastInsert', { ago: timeAgo(data.last_insert_ts) })}
            </span>
          )}
        </div>

        {/* Posiciones hoy */}
        <div className="glass rounded-2xl p-5 flex flex-col gap-2">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-widest">
            {t('an.status.positionsToday')}
          </span>
          {loading ? (
            <div className="h-9 w-20 rounded-lg bg-gray-200 dark:bg-white/5 animate-pulse" />
          ) : (
            <span className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums leading-none">
              {formatNumber(data?.positions_today)}
            </span>
          )}
          <span className="text-xs text-gray-400 dark:text-gray-500">{t('an.status.sinceMidnight')}</span>
        </div>
      </div>

      {/* Historial de compactaciones */}
      <div className="glass rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-widest">
            {t('an.status.history')}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">{t('an.status.last14')}</span>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-gray-100 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : !data?.compact_history?.length ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">
            {t('an.status.none')}
          </p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="pb-2 pr-4 text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">{t('an.col.date')}</th>
                  <th className="pb-2 pr-4 text-xs font-medium text-gray-500 dark:text-gray-400 text-right whitespace-nowrap">{t('an.status.aircraft')}</th>
                  <th className="pb-2 pr-4 text-xs font-medium text-gray-500 dark:text-gray-400 text-right whitespace-nowrap">{t('an.status.positions')}</th>
                  <th className="pb-2 pr-4 text-xs font-medium text-gray-500 dark:text-gray-400 text-right whitespace-nowrap">{t('an.status.busiest')}</th>
                  <th className="pb-2 text-xs font-medium text-gray-500 dark:text-gray-400 text-right whitespace-nowrap">{t('an.status.maxDist')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {data.compact_history.map((row) => (
                  <tr key={row.date} className="group">
                    <td className="py-2.5 pr-4 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                      {formatDate(row.date)}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-gray-600 dark:text-gray-300">
                      {formatNumber(row.unique_aircraft)}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-gray-600 dark:text-gray-300">
                      {formatNumber(row.total_positions)}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-gray-500 dark:text-gray-400">
                      {row.busiest_hour != null
                        ? `${String(row.busiest_hour).padStart(2, '0')}:00`
                        : '—'}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDistance(row.max_distance_km, 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
