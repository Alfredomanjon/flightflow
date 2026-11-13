import type { NearPlane } from '../hooks/useNearest';
import { cleanCallsign, formatDistance, t } from '@flightflow/shared';

interface Props {
  radiusKm: number;
  nearest: NearPlane | null;
  online: boolean;
}

export function EmptySky({ radiusKm, nearest, online }: Props) {
  return (
    <div className="portrait-enter flex flex-1 flex-col items-center justify-center gap-[1.5vmin] text-center">
      <svg viewBox="0 0 24 24" className="h-[7vmin] w-[7vmin] opacity-40" fill="currentColor" aria-hidden="true">
        <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2h-1A1.5 1.5 0 0 0 9 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L12 19v-5.5L21 16Z" />
      </svg>
      <p
        className="font-semibold uppercase tracking-[0.18em]"
        style={{ fontSize: 'calc(15 * var(--u))' }}
      >
        {online ? t('portrait.noTraffic') : t('portrait.noReceiver')}
      </p>
      <p className="opacity-60" style={{ fontSize: 'calc(12.5 * var(--u))' }}>
        {online
          ? nearest
            ? t('portrait.nearest', {
                callsign: cleanCallsign(nearest.ac.flight) || nearest.ac.hex.toUpperCase(),
                dist: formatDistance(nearest.distKm, 0),
              })
            : t('portrait.noneWithin', { r: formatDistance(radiusKm, 0) })
          : t('portrait.retrying')}
      </p>
    </div>
  );
}
