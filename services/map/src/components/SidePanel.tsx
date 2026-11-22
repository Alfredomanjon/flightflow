import { useEffect, useRef, useState } from 'react';
import { t, type Aircraft, type AircraftInfo, type Metar, type StatsResponse } from '@flightflow/shared';
import { TrafficList } from './TrafficList';
import { StatsPanel } from './StatsPanel';
import { AircraftDetail } from './AircraftDetail';
import { AirportPanel } from './AirportPanel';
import type { Airport } from '../data/airports';
import { Segmented } from './ui/Segmented';
import { ChevronDownIcon, SidebarIcon } from './ui/icons';

interface Props {
  aircraft: Aircraft[];
  withPosition: Aircraft[];
  stats: StatsResponse | null;
  selectedHex: string | null;
  onSelect: (hex: string | null) => void;
  selectedAircraft: Aircraft | null;
  selectedAircraftInfo: AircraftInfo | null;
  trailLength: number;
  following: boolean;
  onToggleFollow: () => void;
  airport: Airport | null;
  isHomeAirport: boolean;
  metar: Metar | null;
  onCloseAirport: () => void;
  onCenterAirport: () => void;
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
  following,
  onToggleFollow,
  airport,
  isHomeAirport,
  metar,
  onCloseAirport,
  onCenterAirport,
}: Props) {
  const [tab, setTab] = useState<Tab>('traffic');
  const [collapsed, setCollapsed] = useState(selectedHex == null);

  // Auto-expandir cuando el usuario selecciona un avión (de null a algo)
  const prevHexRef = useRef<string | null>(selectedHex);
  useEffect(() => {
    if (selectedHex && !prevHexRef.current) {
      setCollapsed(false);
    }
    prevHexRef.current = selectedHex;
  }, [selectedHex]);

  // Al abrir un aeropuerto, el panel se despliega.
  const prevAirportRef = useRef<string | null>(null);
  useEffect(() => {
    if (airport && prevAirportRef.current !== airport.icao) setCollapsed(false);
    prevAirportRef.current = airport?.icao ?? null;
  }, [airport]);

  const showDetail = selectedAircraft != null;
  const showAirport = !showDetail && airport != null;

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
        <ChevronDownIcon className="toggle-chevron sm:hidden" />
        <SidebarIcon className="toggle-panel hidden sm:block" />
      </button>

      {/* Panel principal */}
      <div className="sidepanel glass flex flex-col rounded-2xl p-3">
        {showDetail ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <AircraftDetail
              aircraft={selectedAircraft}
              info={selectedAircraftInfo}
              trailLength={trailLength}
              following={following}
              onToggleFollow={onToggleFollow}
              onClose={() => onSelect(null)}
            />
          </div>
        ) : showAirport ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <AirportPanel
              airport={airport}
              isHome={isHomeAirport}
              metar={metar}
              aircraft={withPosition}
              onClose={onCloseAirport}
              onCenter={onCenterAirport}
              onSelect={onSelect}
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
