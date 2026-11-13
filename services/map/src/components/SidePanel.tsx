import { useEffect, useRef, useState } from 'react';
import { t, type Aircraft, type AircraftInfo, type StatsResponse } from '@flightflow/shared';
import { TrafficList } from './TrafficList';
import { StatsPanel } from './StatsPanel';
import { AircraftDetail } from './AircraftDetail';

interface Props {
  aircraft: Aircraft[];
  withPosition: Aircraft[];
  stats: StatsResponse | null;
  selectedHex: string | null;
  onSelect: (hex: string | null) => void;
  selectedAircraft: Aircraft | null;
  selectedAircraftInfo: AircraftInfo | null;
  trailLength: number;
}

type Tab = 'traffic' | 'stats';

export function SidePanel({
  aircraft,
  withPosition,
  stats,
  selectedHex,
  onSelect,
  selectedAircraft,
  selectedAircraftInfo,
  trailLength,
}: Props) {
  const [tab, setTab] = useState<Tab>('traffic');
  const [collapsed, setCollapsed] = useState(true);

  // Auto-expandir cuando el usuario selecciona un avión (de null a algo)
  const prevHexRef = useRef<string | null>(selectedHex);
  useEffect(() => {
    if (selectedHex && !prevHexRef.current) {
      setCollapsed(false);
    }
    prevHexRef.current = selectedHex;
  }, [selectedHex]);

  const showDetail = selectedAircraft != null;

  return (
    <div className="sidepanel-container" data-collapsed={collapsed}>
      {/* Botón colapsar/expandir — abajo (mobile) / izquierda (desktop) del panel */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        title={collapsed ? t('map.showPanel') : t('map.hidePanel')}
        className="sidepanel-toggle glass flex items-center justify-center rounded-[12px] transition hover:brightness-110"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#3f4661"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Panel principal */}
      <div className="sidepanel glass flex flex-col rounded-[24px] sm:rounded-[30px] p-3 sm:p-4">
        {showDetail ? (
          /* Vista detalle de un avión seleccionado */
          <div className="min-h-0 flex-1 overflow-y-auto">
            <AircraftDetail
              aircraft={selectedAircraft}
              info={selectedAircraftInfo}
              trailLength={trailLength}
              onClose={() => onSelect(null)}
            />
          </div>
        ) : (
          /* Vista por defecto: tabs Tráfico / Stats */
          <>
            <div className="glass-inset relative grid h-[42px] grid-cols-2 overflow-hidden rounded-[10px] p-1">
              <button
                type="button"
                onClick={() => setTab('traffic')}
                className={`rounded-[8px] text-[16px] font-bold transition ${
                  tab === 'traffic'
                    ? 'glass-pill-active text-ink-tab dark:text-white'
                    : 'text-ink-tab/70 dark:text-slate-400'
                }`}
              >
                {t('map.tab.traffic')}
              </button>
              <button
                type="button"
                onClick={() => setTab('stats')}
                className={`rounded-[8px] text-[16px] font-bold transition ${
                  tab === 'stats'
                    ? 'glass-pill-active text-ink-tab dark:text-white'
                    : 'text-ink-tab/70 dark:text-slate-400'
                }`}
              >
                {t('map.tab.stats')}
              </button>
            </div>

            <div className="mt-4 flex items-end gap-8 px-1">
              <div>
                <span className="text-[25px] font-bold tabular-nums text-ink-tab dark:text-white">
                  {aircraft.length}
                </span>
                <span className="ml-2 text-[16px] font-semibold text-ink-muted dark:text-slate-400">
                  {t('map.aircraft')}
                </span>
              </div>
              <div>
                <span className="text-[25px] font-bold tabular-nums text-ink-tab dark:text-white">
                  {withPosition.length}
                </span>
                <span className="ml-2 text-[16px] font-semibold text-ink-muted dark:text-slate-400">
                  {t('map.positions')}
                </span>
              </div>
            </div>

            <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
              {tab === 'traffic' ? (
                <TrafficList
                  aircraft={aircraft}
                  selectedHex={selectedHex}
                  onSelect={onSelect}
                />
              ) : (
                <StatsPanel stats={stats} total={aircraft.length} withPos={withPosition.length} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
