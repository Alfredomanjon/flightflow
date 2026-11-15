import {
  airlineCode,
  altitude,
  artFor,
  cleanCallsign,
  distance,
  formatNumber,
  getAirline,
  PlaneArt,
  speed,
  t,
  typeName,
  type AircraftInfo,
} from '@flightflow/shared';
import type { NearPlane } from '../hooks/useNearest';
import type { Phase } from '../hooks/usePhase';
import type { Settings } from '../hooks/useSettings';

import { PhaseIcon } from './ui/icons';
import { AirlineMark } from './AirlineMark';

import { useElementSize } from '../hooks/useKiosk';

interface Props {
  plane: NearPlane;
  info?: AircraftInfo;
  canvas: { w: number; h: number };
  show: Settings['show'];
  /** Aterrizando / despegando, si procede. */
  phase?: Phase;
  /** Cómo indicar la fase: icono, texto u oculto. */
  phaseDisplay: Settings['phase'];
  /** Escala tipográfica relativa: con 1 avión el texto es más grande. */
  scale: number;
}

const nf = (v: number, digits = 0) => formatNumber(v, digits, digits);

export function PlaneCard({ plane, info, canvas, show, phase, phaseDisplay, scale }: Props) {
  const [cardRef, card] = useElementSize<HTMLElement>();
  const [capRef, cap] = useElementSize<HTMLDivElement>();
  const { ac, distKm } = plane;
  const callsign = cleanCallsign(ac.flight) || ac.hex.toUpperCase();
  const type = ac.t || info?.icaoType;
  const { art } = artFor(type, ac.category);
  const code = airlineCode(callsign);
  const airline = (code && getAirline(code)?.name) || info?.operator;
  const reg = ac.r || info?.registration;
  const model = typeName(type, info?.fullType);
  const track = ac.track ?? ac.true_heading ?? ac.mag_heading;
  // Los dibujos miran a la izquierda; si va hacia el este, lo giramos.
  const flip = track != null && track > 0 && track < 180;

  const stats: string[] = [];
  if (show.dist) {
    const d = distance(distKm);
    stats.push(`${nf(d.value, d.value < 10 ? 1 : 0)} ${d.unit}`);
  }
  if (typeof ac.alt_baro === 'number') {
    const a = altitude(ac.alt_baro);
    stats.push(`${nf(a.value)} ${a.unit}`);
  }
  if (show.speed && ac.gs != null) {
    const v = speed(ac.gs);
    stats.push(`${nf(v.value)} ${v.unit}`);
  }

  const artWidth = card.w * 0.92;
  const free = card.h - cap.h - card.h * 0.06;
  const artHeight = Math.max(0, Math.min(free, (artWidth * canvas.h) / canvas.w));

  const phaseLabel = phase === 'landing' ? t('portrait.landing') : t('portrait.takingOff');
  const fs = (base: number) => `calc(${base} * var(--u) * ${scale})`;

  return (
    <article ref={cardRef} className="portrait-enter flex min-h-0 min-w-0 flex-1 flex-col justify-center">
      {/* El dibujo ocupa lo que quede tras el pie, limitado por el ancho: así el
          bloque dibujo + pie queda centrado tanto en vertical como en horizontal. */}
      <div className="w-full shrink-0 px-[4%]" style={{ height: artHeight }}>
        <PlaneArt art={art} canvas={canvas} flip={flip} label={`${model} ${callsign}`} />
      </div>
      <div className="mx-[4%] mt-[1.2vmin] h-px shrink-0 bg-current opacity-25" />

      <div ref={capRef} className="mx-[4%] mt-[1.6vmin] shrink-0 space-y-[0.6vmin] text-center">
        <div className="relative flex items-center justify-center gap-[1.4vmin]">
          {show.logo && code && <AirlineMark code={code} size={fs(26)} />}
          <h2
            className="font-semibold uppercase leading-none tracking-[0.14em]"
            style={{ fontSize: fs(30) }}
          >
            {callsign}
          </h2>
          {phase && phaseDisplay === 'icon' && (
            <span
              className="phase-mark absolute right-0 top-1/2 -translate-y-1/2 opacity-80"
              data-phase={phase}
              style={{ width: fs(22), height: fs(22) }}
              role="img"
              title={phaseLabel}
              aria-label={phaseLabel}
            >
              <PhaseIcon phase={phase} />
            </span>
          )}
        </div>
        <p className="line-clamp-2 text-balance leading-tight opacity-80" style={{ fontSize: fs(15) }}>
          {[airline, model, show.reg ? reg : null].filter(Boolean).join(' · ')}
        </p>
        {stats.length > 0 && (
          <p
            className="truncate uppercase tabular-nums tracking-[0.08em] opacity-60"
            style={{ fontSize: fs(12.5) }}
          >
            {stats.join('   ·   ')}
          </p>
        )}
        {phase && phaseDisplay === 'text' && (
          <p
            className="font-medium uppercase tracking-[0.2em]"
            style={{ fontSize: fs(12.5) }}
          >
            {phase === 'landing' ? '↓ ' + t('portrait.landing') : '↑ ' + t('portrait.takingOff')}
          </p>
        )}
      </div>
    </article>
  );
}
