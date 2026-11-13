import { formatAltitude, formatDistance, formatNumber, formatSpeed, formatTime, tn, t } from '@flightflow/shared'
import type { Flight } from '../api'

interface FlightTableProps {
  flights: Flight[]
  total: number
  page: number
  pages: number
  onPageChange: (p: number) => void
  loading?: boolean
}


export function FlightTable({ flights, total, page, pages, onPageChange, loading }: FlightTableProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-gray-500">
        {tn('an.flights.found', total, { n: formatNumber(total) })}
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/8 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <Th>{t('an.col.date')}</Th>
                <Th>{t('an.col.callsign')}</Th>
                <Th>{t('an.col.reg')}</Th>
                <Th>{t('an.col.type')}</Th>
                <Th>{t('an.col.firstSeen')}</Th>
                <Th>{t('an.col.duration')}</Th>
                <Th>{t('an.col.maxAlt')}</Th>
                <Th>{t('an.col.minDist')}</Th>
                <Th>{t('an.col.avgSpeed')}</Th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-white/5">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 rounded bg-gray-200 dark:bg-white/5 animate-pulse w-16" />
                        </td>
                      ))}
                    </tr>
                  ))
                : flights.map((f) => (
                    <tr
                      key={f.id}
                      className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
                    >
                      <Td>{f.date}</Td>
                      <Td>
                        <span className="font-mono text-primary-600 dark:text-primary-300">{f.flight ?? '—'}</span>
                      </Td>
                      <Td>{f.reg ?? '—'}</Td>
                      <Td>
                        <span className="text-accent-600 dark:text-accent-400">{f.type ?? '—'}</span>
                      </Td>
                      <Td>{formatTime(f.first_seen)}</Td>
                      <Td>{f.duration_min != null ? `${f.duration_min} min` : '—'}</Td>
                      <Td>{formatAltitude(f.max_alt_baro)}</Td>
                      <Td>{formatDistance(f.min_distance_km)}</Td>
                      <Td>{formatSpeed(f.avg_gs)}</Td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <PageBtn disabled={page <= 1} onClick={() => onPageChange(page - 1)}>←</PageBtn>
          <span className="text-sm text-gray-500 dark:text-gray-400">{page} / {pages}</span>
          <PageBtn disabled={page >= pages} onClick={() => onPageChange(page + 1)}>→</PageBtn>
        </div>
      )}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left font-medium">{children}</th>
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{children}</td>
}

function PageBtn({ children, disabled, onClick }: {
  children: React.ReactNode
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
    >
      {children}
    </button>
  )
}
