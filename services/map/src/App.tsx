import { useCallback, useMemo, useState } from 'react';
import {
  config,
  fetchLiveStats,
  fetchMetar,
  useAircraft,
  useAircraftDb,
  useClock,
  useDarkMode,
  usePolling,
  type Aircraft,
} from '@flightflow/shared';
import { METAR_ENABLED, METAR_REFRESH_MS, ONLINE_TIMEOUT_MS, REFRESH_MS, STATS_REFRESH_MS } from './config';
import { useAircraftTrails } from './hooks/useAircraftTrails';
import { useCallsignMode } from './hooks/useCallsignMode';
import { useViewMode } from './hooks/useViewMode';
import { Map } from './components/Map';
import { AirportCard } from './components/AirportCard';
import { SidePanel } from './components/SidePanel';

export default function App() {
  const { aircraft, online } = useAircraft(REFRESH_MS, ONLINE_TIMEOUT_MS);
  const stats = usePolling(fetchLiveStats, STATS_REFRESH_MS);
  const metar = usePolling(fetchMetar, METAR_REFRESH_MS, METAR_ENABLED);
  const now = useClock();
  const [selectedHex, setSelectedHex] = useState<string | null>(null);

  const hexes = useMemo(() => aircraft.map((a) => a.hex), [aircraft]);
  // Demo traffic uses fictitious hex codes: don't look them up.
  const db = useAircraftDb(config().receiver.mock ? [] : hexes, 'ff:map:hexdb-v1');

  const enriched: Aircraft[] = useMemo(
    () =>
      aircraft.map((a) => {
        const info = db[a.hex];
        if (!info) return a;
        return {
          ...a,
          r: a.r || info.registration,
          t: a.t || info.fullType || info.icaoType,
        };
      }),
    [aircraft, db],
  );

  const enrichedWithPos = useMemo(
    () => enriched.filter((a) => typeof a.lat === 'number' && typeof a.lon === 'number'),
    [enriched],
  );

  const [darkMode, toggleDark] = useDarkMode('ff:map:dark');
  const { getTrail, version: trailVersion } = useAircraftTrails(enrichedWithPos);
  const selectedTrail = selectedHex ? getTrail(selectedHex) ?? null : null;
  const [callsignMode, cycleCallsign] = useCallsignMode();
  const [viewMode, toggleViewMode] = useViewMode();

  // Derivamos el avión seleccionado de la lista enriquecida (mantiene posición
  // y datos al día en cada poll).
  const selectedAircraft = useMemo(
    () => (selectedHex ? enriched.find((a) => a.hex === selectedHex) ?? null : null),
    [enriched, selectedHex],
  );
  const selectedAircraftInfo = selectedHex ? db[selectedHex] ?? null : null;
  const trailLength = selectedTrail?.length ?? 0;

  const handleSelect = useCallback((hex: string | null) => {
    setSelectedHex(hex);
  }, []);

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden">
      <Map
        aircraft={enrichedWithPos}
        selectedHex={selectedHex}
        onSelect={handleSelect}
        darkMode={darkMode}
        trail={selectedTrail}
        trailVersion={trailVersion}
        callsignMode={callsignMode}
        viewMode={viewMode}
      />
      <AirportCard
        online={online}
        now={now}
        metar={metar}
        darkMode={darkMode}
        onToggleDark={toggleDark}
        callsignMode={callsignMode}
        onCycleCallsign={cycleCallsign}
        viewMode={viewMode}
        onToggleViewMode={toggleViewMode}
      />
      <SidePanel
        aircraft={enriched}
        withPosition={enrichedWithPos}
        stats={stats}
        selectedHex={selectedHex}
        onSelect={handleSelect}
        selectedAircraft={selectedAircraft}
        selectedAircraftInfo={selectedAircraftInfo}
        trailLength={trailLength}
      />
    </div>
  );
}
