import { useState } from 'react'
import { badgeTextColor, fallbackColor, formatShortDate, getAirline, logoUrl, t } from '@flightflow/shared'

interface AirlineEntry {
  code: string
  count: number
}

interface Props {
  airlines: AirlineEntry[]
  loading?: boolean
  date?: string
}

function AirlineAvatar({ code, color }: { code: string; color: string }) {
  const initials = getAirline(code)?.iata ?? code.slice(0, 2)
  const textColor = badgeTextColor(color)

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs"
      style={{ backgroundColor: color, color: textColor }}
    >
      {initials}
    </div>
  )
}

function AirlineLogo({ code, color }: { code: string; color: string }) {
  const [failed, setFailed] = useState(false)
  const src = logoUrl(code)

  if (src && !failed) {
    return (
      <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden bg-white flex items-center justify-center">
        <img
          src={src}
          alt={code}
          className="w-full h-full object-contain"
          onError={() => setFailed(true)}
        />
      </div>
    )
  }
  return <AirlineAvatar code={code} color={color} />
}

export function TopAirlinesWidget({ airlines, loading = false, date }: Props) {
  const max = airlines[0]?.count ?? 1

  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-5 md:col-span-2">
      <div className="flex items-start justify-between gap-2">
        <span className="label-caps">
          {t('an.topAirlines')}
        </span>
        {date && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {formatShortDate(date)}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/5 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-gray-200 dark:bg-white/5" />
                <div className="h-2 w-full rounded bg-gray-100 dark:bg-white/[0.03]" />
              </div>
              <div className="h-3 w-8 rounded bg-gray-200 dark:bg-white/5 shrink-0" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col justify-between flex-1 gap-3">
          {airlines.map((entry, i) => {
            const info = getAirline(entry.code)
            const color = info?.color ?? fallbackColor(entry.code)
            const pct = Math.round((entry.count / max) * 100)
            return (
              <div key={entry.code} className="flex items-center gap-3">
                <AirlineLogo code={entry.code} color={color} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                      {info?.name ?? entry.code}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-[#636366] ml-2 shrink-0 tabular-nums">
                      {entry.count}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-black/5 dark:bg-white/5">
                    <div
                      className="h-1 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.9 - i * 0.08 }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
