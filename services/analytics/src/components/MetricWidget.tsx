import { type ReactNode } from 'react'

interface Change {
  value: number
  period: string
}

interface MetricWidgetProps {
  title: string
  value: ReactNode
  unit?: string
  change?: Change | null
  subtitle?: string
  icon?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const colSpan = { sm: '', md: 'md:col-span-2', lg: 'md:col-span-4' }

export function MetricWidget({
  title,
  value,
  unit,
  change,
  subtitle,
  icon,
  size = 'sm',
  loading = false,
}: MetricWidgetProps) {
  const changePositive = change && change.value > 0
  const changeNeutral  = change && change.value === 0

  return (
    <div className={`glass rounded-2xl p-5 flex flex-col gap-3 ${colSpan[size]}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="label-caps leading-tight">
          {title}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {icon && (
            <span className="text-[#007AFF] opacity-70">{icon}</span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-9 w-24 rounded-lg bg-gray-200 dark:bg-white/5 animate-pulse" />
      ) : (
        <div className="flex items-baseline gap-1.5">
          <span className="text-[32px] font-semibold text-gray-900 dark:text-white tabular-nums leading-none tracking-tight">
            {value ?? '—'}
          </span>
          {unit && (
            <span className="text-sm text-gray-500 dark:text-[#8E8E93] font-medium">{unit}</span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 mt-auto">
        {change != null && !loading && (
          <span
            className={`flex items-center gap-0.5 text-xs font-semibold rounded-full px-2 py-0.5 ${
              changeNeutral
                ? 'bg-gray-100 text-gray-500 dark:bg-white/8 dark:text-[#8E8E93]'
                : changePositive
                ? 'bg-[#34C759]/12 text-[#1A9C3E] dark:bg-[#34C759]/15 dark:text-[#34C759]'
                : 'bg-[#FF3B30]/10 text-[#D63025] dark:bg-[#FF3B30]/15 dark:text-[#FF3B30]'
            }`}
          >
            {!changeNeutral && (
              <svg
                className="w-3 h-3"
                viewBox="0 0 12 12"
                fill="currentColor"
                style={{ transform: changePositive ? 'none' : 'rotate(180deg)' }}
              >
                <path d="M6 2 L10 8 L2 8 Z" />
              </svg>
            )}
            {change.value > 0 ? '+' : ''}{change.value}%
          </span>
        )}
        {(change?.period || subtitle) && (
          <span className="text-xs text-gray-400 dark:text-[#636366] truncate">
            {change?.period ?? subtitle}
          </span>
        )}
      </div>
    </div>
  )
}
