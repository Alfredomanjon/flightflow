import { t } from '@flightflow/shared';

/** Mismo badge que la página Service de Analytics. */
export function StatusBadge({ ok, okLabel, koLabel }: { ok: boolean; okLabel?: string; koLabel?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        ok
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
          : 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? 'animate-pulse bg-emerald-500' : 'bg-red-500'}`} />
      {ok ? (okLabel ?? t('common.online')) : (koLabel ?? t('common.offline'))}
    </span>
  );
}
