import { useEffect, useState } from 'react'
import { t } from '@flightflow/shared'
import { api, type Flight, type PagedResponse } from '../api'
import { FilterBar, type FlightFilters } from '../components/FilterBar'
import { FlightTable } from '../components/FlightTable'

function today() {
  return new Date().toISOString().slice(0, 10)
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10)
}

const DEFAULT_FILTERS: FlightFilters = {
  from_date: daysAgo(29),
  to_date:   today(),
  flight:    '',
  reg:       '',
  type:      '',
}

export function Flights() {
  const [filters, setFilters] = useState<FlightFilters>(DEFAULT_FILTERS)
  const [page, setPage]       = useState(1)
  const [result, setResult]   = useState<PagedResponse<Flight> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.flights({ ...filters, page, limit: 50 })
      .then(setResult)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [filters, page])

  function handleFilterChange(f: FlightFilters) {
    setFilters(f)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('an.flights.title')}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-500 mt-1">{t('an.flights.subtitle')}</p>
      </div>

      <FilterBar
        filters={filters}
        onChange={handleFilterChange}
        onReset={() => { setFilters(DEFAULT_FILTERS); setPage(1) }}
      />

      {error && (
        <div className="glass rounded-2xl p-4 text-red-400 text-sm">
          {t('an.error', { msg: error })}
        </div>
      )}

      <FlightTable
        flights={result?.items ?? []}
        total={result?.total ?? 0}
        page={page}
        pages={result?.pages ?? 1}
        onPageChange={setPage}
        loading={loading}
      />
    </div>
  )
}
