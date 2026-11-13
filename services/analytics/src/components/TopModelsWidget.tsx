import { AircraftArt, formatShortDate, t, typeName } from '@flightflow/shared'

interface ModelEntry {
  type: string
  count: number
}

interface Props {
  models: ModelEntry[]
  loading?: boolean
  date?: string
}


function modelColor(type: string): string {
  const code = type.toUpperCase()
  // Airbus — violeta
  if (code.startsWith('A3') || code === 'A20N' || code === 'A21N' || code === 'A19N') return '#9333EA'
  // Boeing — azul
  if (code.startsWith('B')) return '#2563EB'
  // Embraer — naranja
  if (code.startsWith('E1') || code.startsWith('E7') || code === 'E75L') return '#F97316'
  // Bombardier CRJ — cian
  if (code.startsWith('CRJ')) return '#06B6D4'
  // ATR y De Havilland Canada — verde
  if (code.startsWith('AT') || code.startsWith('DH')) return '#10B981'
  let hash = 0
  for (const c of type) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff
  return ['#2563EB', '#9333EA', '#F97316', '#06B6D4', '#10B981', '#EC4899'][hash % 6]
}

const modelName = (type: string) => typeName(type, type)


export function TopModelsWidget({ models, loading = false, date }: Props) {
  const max = models[0]?.count ?? 1
  const topModel = models[0] ?? null
  const heroColor = topModel ? modelColor(topModel.type) : ''
  const restModels = models.slice(1)

  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-4 md:col-span-2">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <span className="label-caps">{t('an.topModels')}</span>
        {date && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {formatShortDate(date)}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          <div className="animate-pulse rounded-xl h-24 bg-gray-100 dark:bg-white/5" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-4 h-3 rounded bg-gray-200 dark:bg-white/5 shrink-0" />
              <div className="w-14 h-4 rounded bg-gray-200 dark:bg-white/5 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-gray-200 dark:bg-white/5" />
                <div className="h-2 w-full rounded bg-gray-100 dark:bg-white/[0.03]" />
              </div>
              <div className="h-3 w-8 rounded bg-gray-200 dark:bg-white/5 shrink-0" />
            </div>
          ))}
        </div>
      ) : models.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 italic">
          {t('an.noModels')}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {/* ── Hero card: #1 aircraft ── */}
          {topModel && (
            <div
              className="relative rounded-xl overflow-hidden"
              style={{ backgroundColor: `${heroColor}18` }}
            >
              {/* Oversized watermark silhouette */}
              <div
                className="absolute right-[-8px] inset-y-0 flex items-center pointer-events-none select-none"
                style={{ color: heroColor, opacity: 0.14 }}
              >
                <AircraftArt type={topModel.type} className="h-32 w-auto" />
              </div>

              <div className="relative flex items-center justify-between gap-4 p-4">
                {/* Left: metadata */}
                <div className="flex flex-col gap-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-bold tracking-widest uppercase text-white leading-none px-2 py-1 rounded-full shrink-0"
                      style={{ backgroundColor: heroColor }}
                    >
                      #1
                    </span>
                    <span className="label-caps">{t('an.mostSeen')}</span>
                  </div>

                  <div className="flex flex-col leading-tight">
                    <span className="text-[15px] font-semibold text-gray-900 dark:text-white truncate">
                      {modelName(topModel.type)}
                    </span>
                    <span className="text-[11px] font-mono text-gray-400 dark:text-gray-500 mt-0.5">
                      {topModel.type}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span
                      className="text-[26px] font-bold tabular-nums leading-none tracking-tight"
                      style={{ color: heroColor }}
                    >
                      {topModel.count}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{t('an.flightsWord')}</span>
                  </div>
                </div>

                {/* Right: visible silhouette */}
                <div className="shrink-0" style={{ color: heroColor }}>
                  <AircraftArt type={topModel.type} className="h-16 w-auto drop-shadow-sm" />
                </div>
              </div>
            </div>
          )}

          {/* ── Ranked list: positions 2–N ── */}
          <div className="flex flex-col gap-2.5">
            {restModels.map((entry, i) => {
              const color = modelColor(entry.type)
              const name  = modelName(entry.type)
              const pct   = Math.round((entry.count / max) * 100)
              return (
                <div key={entry.type} className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 w-4 shrink-0 tabular-nums text-right">
                    {i + 2}
                  </span>
                  <div className="shrink-0 w-32 flex items-center" style={{ color }}>
                    <AircraftArt type={entry.type} className="h-9 w-auto" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                        {name}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-[#636366] ml-2 shrink-0 tabular-nums">
                        {entry.count}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-black/5 dark:bg-white/5">
                      <div
                        className="h-1 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.85 - i * 0.08 }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
