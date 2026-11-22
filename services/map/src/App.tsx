import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Map as MlMap } from 'maplibre-gl';
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
import { Topbar } from './components/Topbar';
import { MapControls } from './components/MapControls';
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
  const [callsignMode, setCallsignMode] = useCallsignMode();
  const [viewMode, setViewMode] = useViewMode();
  const [map, setMap] = useState<MlMap | null>(null);

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

  // Desde el buscador: selecciona y centra el mapa en el avión.
  const handlePick = useCallback(
    (hex: string) => {
      setSelectedHex(hex);
      const a = enrichedWithPos.find((x) => x.hex === hex);
      if (a && map) {
        map.flyTo({ center: [a.lon!, a.lat!], zoom: Math.max(map.getZoom(), 9.5), essential: true });
      }
    },
    [enrichedWithPos, map],
  );

  // Esc cierra el detalle (si no se está escribiendo en un campo).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.key === 'Escape' && !(el && el.tagName === 'INPUT')) setSelectedHex(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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
        onMapReady={setMap}
      />
      <Topbar
        aircraft={enrichedWithPos}
        online={online}
        now={now}
        metar={metar}
        metarEnabled={METAR_ENABLED}
        darkMode={darkMode}
        onToggleDark={toggleDark}
        onPick={handlePick}
      />
      <MapControls
        map={map}
        callsignMode={callsignMode}
        onCallsignMode={setCallsignMode}
        viewMode={viewMode}
        onViewMode={setViewMode}
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
