import { useEffect, useRef, useState } from 'react';
import { t, type Aircraft, type AircraftInfo, type StatsResponse } from '@flightflow/shared';
import { TrafficList } from './TrafficList';
import { StatsPanel } from './StatsPanel';
import { AircraftDetail } from './AircraftDetail';
import { Segmented } from './ui/Segmented';

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
      {/* Botón colapsar/expandir — a la derecha del panel (desktop) / encima (móvil) */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        title={collapsed ? t('map.showPanel') : t('map.hidePanel')}
        aria-label={collapsed ? t('map.showPanel') : t('map.hidePanel')}
        aria-expanded={!collapsed}
        className="sidepanel-toggle glass flex items-center justify-center text-gray-500 transition-colors hover:text-gray-900 dark:text-[#8E8E93] dark:hover:text-white"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Panel principal */}
      <div className="sidepanel glass flex flex-col rounded-2xl p-3">
        {showDetail ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <AircraftDetail
              aircraft={selectedAircraft}
              info={selectedAircraftInfo}
              trailLength={trailLength}
              onClose={() => onSelect(null)}
            />
          </div>
        ) : (
          <>
            <Segmented<Tab>
              label={t('map.tab.traffic')}
              value={tab}
              onChange={setTab}
              options={[
                { value: 'traffic', label: t('map.tab.traffic') },
                { value: 'stats', label: t('map.tab.receiver') },
              ]}
            />

            <p className="mb-2 mt-3 px-1 text-sm text-gray-500 dark:text-[#8E8E93]">
              <span className="text-base font-semibold tabular-nums text-gray-900 dark:text-white">
                {aircraft.length}
              </span>{' '}
              {t('map.aircraft')} ·{' '}
              <span className="text-base font-semibold tabular-nums text-gray-900 dark:text-white">
                {withPosition.length}
              </span>{' '}
              {t('map.positions')}
            </p>

            {tab === 'traffic' ? (
              <TrafficList aircraft={aircraft} selectedHex={selectedHex} onSelect={onSelect} />
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <StatsPanel stats={stats} total={aircraft.length} withPos={withPosition.length} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
