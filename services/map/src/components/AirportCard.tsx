import { formatUtc, t, type Metar } from '@flightflow/shared';
import { HOME_AIRPORT, METAR_ENABLED } from '../config';
import type { CallsignMode } from '../hooks/useCallsignMode';
import type { ViewMode } from '../hooks/useViewMode';

interface Props {
  online: boolean;
  now: Date;
  metar: Metar | null;
  darkMode: boolean;
  onToggleDark: () => void;
  callsignMode: CallsignMode;
  onCycleCallsign: () => void;
  viewMode: ViewMode;
  onToggleViewMode: () => void;
}

const callsignLabel = (m: CallsignMode) =>
  t(`map.callsigns.${m}`, { place: HOME_AIRPORT.icao || t('map.receiver') });

const viewModeLabel = (m: ViewMode) => t(`map.view.${m}`);

export function AirportCard({
  online,
  now,
  metar,
  darkMode,
  onToggleDark,
  callsignMode,
  onCycleCallsign,
  viewMode,
  onToggleViewMode,
}: Props) {
  return (
    <div className="airport-card-wrapper absolute z-20 left-3 right-3 sm:left-[21px] sm:right-auto sm:w-[560px] sm:max-w-[calc(100vw-440px)]">
      {/* Tarjeta principal */}
      <div className="glass relative h-[56px] sm:h-[68px] rounded-[20px] sm:rounded-[24px]">
        {/* Código ICAO + nombre, centrados verticalmente */}
        <div className="absolute inset-y-0 left-[16px] sm:left-[22px] flex flex-col justify-center gap-[2px] sm:gap-[4px]">
          <p className="text-[22px] sm:text-[26px] font-bold leading-none text-ink-primary dark:text-white">
            {HOME_AIRPORT.icao || 'RX'}
          </p>
          <p className="hidden sm:block text-[13px] font-semibold leading-none text-ink-muted dark:text-slate-400">
            {HOME_AIRPORT.name}
          </p>
        </div>

        {/* Fila derecha: estado, botones, hora */}
        <div className="absolute inset-y-0 right-[12px] sm:right-[16px] flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-block h-[9px] w-[9px] rounded-full ${
                online ? 'bg-emerald-500' : 'bg-red-500'
              }`}
              style={{
                boxShadow: online
                  ? '0 0 5px rgba(16,185,129,0.6)'
                  : '0 0 5px rgba(239,68,68,0.6)',
              }}
            />
            <span className="hidden sm:inline text-[11px] text-black dark:text-slate-400">
              {online ? t('common.online') : t('common.offline')}
            </span>
          </div>

          {/* Botón modo de visualización — físico / autoplay */}
          <button
            type="button"
            onClick={onToggleViewMode}
            title={viewModeLabel(viewMode)}
            className="glass-inset flex h-[32px] w-[32px] sm:h-[24px] sm:w-[24px] items-center justify-center rounded-full transition hover:brightness-110"
          >
            {viewMode === 'physical' ? (
              /* Radar / antena */
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke={darkMode ? '#cfd8e8' : '#3f4661'} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                className="h-[16px] w-[16px] sm:h-[13px] sm:w-[13px]">
                <path d="M19.07 4.93A10 10 0 0 0 6.99 3.34" />
                <path d="M4 6h.01" />
                <path d="M2.29 9.62A10 10 0 1 0 21.31 8.35" />
                <path d="M16.24 7.76A6 6 0 1 0 18 12" />
                <path d="M12 18h.01" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            ) : (
              /* Play */
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                fill={darkMode ? '#ffd166' : '#e08a00'}
                stroke="none"
                className="h-[16px] w-[16px] sm:h-[13px] sm:w-[13px]">
                <polygon points="6 4 20 12 6 20 6 4" />
              </svg>
            )}
          </button>

          {/* Botón modo de callsigns — cicla off / nearby / all */}
          <button
            type="button"
            onClick={onCycleCallsign}
            title={callsignLabel(callsignMode)}
            className="glass-inset flex h-[32px] w-[32px] sm:h-[24px] sm:w-[24px] items-center justify-center rounded-full transition hover:brightness-110"
          >
            {callsignMode === 'all' ? (
              /* Ojo abierto */
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke={darkMode ? '#cfd8e8' : '#3f4661'} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                className="h-[16px] w-[16px] sm:h-[13px] sm:w-[13px]">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : callsignMode === 'nearby' ? (
              /* Diana / target — solo cercanos */
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke={darkMode ? '#9ab8ff' : '#123b89'} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                className="h-[16px] w-[16px] sm:h-[13px] sm:w-[13px]">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            ) : (
              /* Ojo tachado */
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke={darkMode ? '#cfd8e8' : '#3f4661'} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                className="h-[16px] w-[16px] sm:h-[13px] sm:w-[13px]">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-7-11-7a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A10.05 10.05 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19" />
                <path d="M1 1l22 22" />
              </svg>
            )}
          </button>

          {/* Botón sun / moon */}
          <button
            type="button"
            onClick={onToggleDark}
            title={darkMode ? t('common.lightMode') : t('common.darkMode')}
            className="glass-inset flex h-[32px] w-[32px] sm:h-[24px] sm:w-[24px] items-center justify-center rounded-full transition hover:brightness-110"
          >
            {darkMode ? (
              /* Sol */
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="h-[16px] w-[16px] sm:h-[13px] sm:w-[13px]">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              /* Luna */
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="#3f4661" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="h-[16px] w-[16px] sm:h-[13px] sm:w-[13px]">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {/* Hora UTC al final de la fila */}
          <div className="ml-0.5 sm:ml-1 whitespace-nowrap text-[13px] sm:text-[16px] font-semibold tabular-nums text-ink-deep dark:text-slate-300">
            {formatUtc(now)}
          </div>
        </div>
      </div>

      {/* Tarjeta METAR (solo con aeropuerto base y map.metar: true) */}
      {METAR_ENABLED && (
        <div className="glass mt-[6px] inline-block max-w-full rounded-[14px] sm:rounded-[20px] px-[14px] sm:px-[20px] py-[7px] sm:py-[10px]">
          <p className="text-[11px] sm:text-[12px] font-medium leading-tight text-ink-deep dark:text-slate-300">
            {metar ? metar.raw : t('map.metarLoading')}
          </p>
        </div>
      )}
    </div>
  );
}
