import { useEffect, useState } from 'react'
import { formatAltitude, formatDistance, formatNumber, t, tn } from '@flightflow/shared'
import { api, type Aircraft, type PagedResponse } from '../api'

export function Aircraft() {
  const [page, setPage]       = useState(1)
  const [result, setResult]   = useState<PagedResponse<Aircraft> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    api.aircraft(page, 50)
      .then(setResult)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [page])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('an.aircraft.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {result ? tn('an.aircraft.count', result.total, { n: formatNumber(result.total) }) : ''}
        </p>
      </div>

      {error && (
        <div className="glass rounded-2xl p-4 text-red-600 dark:text-red-400 text-sm">{t('an.error', { msg: error })}</div>
      )}

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/8 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <Th>#</Th>
                <Th>Hex</Th>
                <Th>{t('an.col.reg')}</Th>
                <Th>{t('an.col.type')}</Th>
                <Th>{t('an.col.appearances')}</Th>
                <Th>{t('an.col.firstSeen')}</Th>
                <Th>{t('an.col.lastSeen')}</Th>
                <Th>{t('an.col.avgMaxAlt')}</Th>
                <Th>{t('an.col.closest')}</Th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-white/5">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 w-16 rounded bg-gray-200 dark:bg-white/5 animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : result?.items.map((a, i) => (
                    <tr key={a.hex} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                      <Td>
                        <span className="text-gray-400 text-xs">{(page - 1) * 50 + i + 1}</span>
                      </Td>
                      <Td>
                        <span className="font-mono text-xs text-gray-400">{a.hex}</span>
                      </Td>
                      <Td>
                        <span className="font-medium text-gray-900 dark:text-white">{a.reg ?? '—'}</span>
                      </Td>
                      <Td>
                        <span className="text-accent-600 dark:text-accent-400">{a.type ?? '—'}</span>
                      </Td>
                      <Td>
                        <span className="font-semibold text-primary-600 dark:text-primary-300">
                          {formatNumber(a.appearances)}
                        </span>
                      </Td>
                      <Td>{a.first_date}</Td>
                      <Td>{a.last_date}</Td>
                      <Td>{formatAltitude(a.avg_max_alt)}</Td>
                      <Td>{formatDistance(a.closest_km)}</Td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {result && result.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <PageBtn disabled={page <= 1} onClick={() => setPage(page - 1)}>←</PageBtn>
          <span className="text-sm text-gray-500 dark:text-gray-400">{page} / {result.pages}</span>
          <PageBtn disabled={page >= result.pages} onClick={() => setPage(page + 1)}>→</PageBtn>
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
