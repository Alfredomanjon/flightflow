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
    <div className="grid grid-cols-2 gap-2">
      <Tile label={t('map.stats.detected')} value={fmt(total)} />
      <Tile label={t('map.stats.withPos')} value={fmt(withPos)} />
      <Tile label={t('map.stats.withoutPos')} value={fmt(stats?.aircraft_without_pos)} />
      <Tile label={t('map.stats.msgs')} value={msgPerSec != null ? fmt(msgPerSec, 1) : '—'} />
      <Tile label={t('map.stats.gain')} value={stats?.gain_db != null ? `${fmt(stats.gain_db, 1)} dB` : '—'} />
      <Tile label={t('map.stats.ppm')} value={stats?.estimated_ppm != null ? fmt(stats.estimated_ppm, 1) : '—'} />
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/[0.04] px-3 py-2.5 dark:bg-white/[0.06]">
      <p className="label-caps">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
