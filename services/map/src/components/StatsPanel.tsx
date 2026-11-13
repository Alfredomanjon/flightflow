import { formatNumber, t, type StatsResponse } from '@flightflow/shared';

interface Props {
  stats: StatsResponse | null;
  total: number;
  withPos: number;
}

const fmt = (n: number | undefined, digits = 0) => formatNumber(n, digits, digits);

export function StatsPanel({ stats, total, withPos }: Props) {
  const accepted1m = stats?.last1min?.local?.accepted?.[0];
  const msgPerSec = accepted1m != null ? accepted1m / 60 : undefined;

  return (
    <div className="flex flex-col gap-3">
      <Row label={t('map.stats.detected')} value={fmt(total)} />
      <Row label={t('map.stats.withPos')} value={fmt(withPos)} />
      <Row label={t('map.stats.withoutPos')} value={fmt(stats?.aircraft_without_pos)} />
      <Row label={t('map.stats.gain')} value={stats?.gain_db != null ? `${fmt(stats.gain_db, 1)} dB` : '—'} />
      <Row label={t('map.stats.ppm')} value={stats?.estimated_ppm != null ? fmt(stats.estimated_ppm, 1) : '—'} />
      <Row label={t('map.stats.msgs')} value={msgPerSec != null ? fmt(msgPerSec, 1) : '—'} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[10px] border border-white/80 bg-white/45 px-3 py-2 backdrop-blur-[5px] dark:border-white/10 dark:bg-white/5">
      <span className="text-[13px] text-ink-muted dark:text-slate-400">{label}</span>
      <span className="text-[15px] font-semibold tabular-nums text-ink-tab dark:text-white">{value}</span>
    </div>
  );
}
