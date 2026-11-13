import { useEffect, useRef, useState, type FormEvent } from 'react'
import { t } from '@flightflow/shared'

export interface FlightFilters {
  from_date: string
  to_date: string
  flight: string
  reg: string
  type: string
}

interface FilterBarProps {
  filters: FlightFilters
  onChange: (f: FlightFilters) => void
  onReset: () => void
}

export function FilterBar({ filters, onChange, onReset }: FilterBarProps) {
  const stickyRef = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    const el = stickyRef.current
    if (!el) return
    const NAVBAR_H = 56 // h-14
    const check = () => {
      const top = el.getBoundingClientRect().top
      // Histéresis de 2px para evitar flicker en el umbral
      setStuck(prev => {
        if (!prev && top <= NAVBAR_H) return true
        if (prev && top > NAVBAR_H + 2) return false
        return prev
      })
    }
    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
  }, [])

  function field(key: keyof FlightFilters) {
    return (e: FormEvent<HTMLInputElement>) =>
      onChange({ ...filters, [key]: e.currentTarget.value })
  }

  const fields = (
    <>
      <Field label={t('an.filter.from')}>
        <input type="date" value={filters.from_date} onChange={field('from_date')} className="input" />
      </Field>
      <Field label={t('an.filter.to')}>
        <input type="date" value={filters.to_date} onChange={field('to_date')} className="input" />
      </Field>
      <Field label={t('an.filter.callsign')}>
        <input type="text" value={filters.flight} onChange={field('flight')} placeholder="IBE1234" className="input w-28" />
      </Field>
      <Field label={t('an.filter.reg')}>
        <input type="text" value={filters.reg} onChange={field('reg')} placeholder="G-EZTH" className="input w-28" />
      </Field>
      <Field label={t('an.filter.type')}>
        <input type="text" value={filters.type} onChange={field('type')} placeholder="A320" className="input w-24" />
      </Field>
      <button
        onClick={onReset}
        className="mb-0.5 text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
      >
        {t('an.filter.clear')}
      </button>
    </>
  )

  return (
    <div ref={stickyRef} className="sticky top-14 z-40 relative">
      {/* Fondo que se expande al ancho completo — nunca afecta el layout del contenido */}
      <div
        aria-hidden="true"
        className={[
          'absolute inset-0 transition-all duration-200',
          stuck
            ? 'glass-strong border-b border-black/5 dark:border-white/8'
            : 'glass rounded-2xl',
        ].join(' ')}
        style={
          stuck
            ? { width: '100vw', marginLeft: 'calc(-50vw + 50%)' }
            : { width: '100%', marginLeft: '0px' }
        }
      />
      {/* Contenido: posición fija, nunca se mueve */}
      <div className="relative flex flex-wrap gap-3 items-end px-4 py-3">
        {fields}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">{label}</span>
      {children}
    </label>
  )
}
