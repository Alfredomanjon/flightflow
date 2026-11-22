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
import { HOME_AIRPORT, METAR_ENABLED, METAR_REFRESH_MS, ONLINE_TIMEOUT_MS, REFRESH_MS, STATS_REFRESH_MS } from './config';
import { useAircraftTrails } from './hooks/useAircraftTrails';
import { useCallsignMode } from './hooks/useCallsignMode';
import { useViewMode } from './hooks/useViewMode';
import { Map } from './components/Map';
import { findAirport } from './data/airports';
import { Topbar } from './components/Topbar';
import { MapControls } from './components/MapControls';
import { SidePanel } from './components/SidePanel';

export default function App() {
  const { aircraft, online } = useAircraft(REFRESH_MS, ONLINE_TIMEOUT_MS);
  const stats = usePolling(fetchLiveStats, STATS_REFRESH_MS);
  const metar = usePolling(fetchMetar, METAR_REFRESH_MS, METAR_ENABLED);
  const now = useClock();
  const [selectedHex, setSelectedHex] = useState<string | null>(() => {
    const h = new URLSearchParams(window.location.search).get('hex');
    return h && /^[0-9a-f]{6}$/i.test(h) ? h.toLowerCase() : null;
  });
  const [following, setFollowing] = useState(false);
  const [airportIcao, setAirportIcao] = useState<string | null>(null);

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
          // `t` debe ser el código ICAO (B738, A320…): de él dependen el icono del mapa y la
          // silueta. El nombre largo del modelo (fullType) no sirve para clasificar.
          t: a.t || info.icaoType || info.fullType,
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
    setFollowing(false);
    if (hex) setAirportIcao(null);
  }, []);

  const airport = airportIcao ? findAirport(airportIcao) ?? null : null;
  const openHomeAirport = useCallback(() => {
    if (!HOME_AIRPORT.icao) return;
    setSelectedHex(null);
    setFollowing(false);
    setAirportIcao(HOME_AIRPORT.icao);
  }, []);
  const openAirport = useCallback((icao: string) => {
    setSelectedHex(null);
    setFollowing(false);
    setAirportIcao(icao);
  }, []);
  const centerAirport = useCallback(() => {
    if (airport && map) map.flyTo({ center: [airport.lon, airport.lat], zoom: 11, essential: true });
  }, [airport, map]);

  // La URL refleja el avión seleccionado (?hex=…) para poder compartirlo.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedHex) url.searchParams.set('hex', selectedHex);
    else url.searchParams.delete('hex');
    window.history.replaceState(null, '', url);
  }, [selectedHex]);

  // Desde el buscador: selecciona y centra el mapa en el avión.
  const handlePick = useCallback(
    (hex: string) => {
      setSelectedHex(hex);
      setFollowing(false);
      setAirportIcao(null);
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
      if (e.key === 'Escape' && !(el && el.tagName === 'INPUT')) {
        setSelectedHex(null);
        setFollowing(false);
      }
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
        followHex={following ? selectedHex : null}
        onStopFollow={() => setFollowing(false)}
        onAirportSelect={openAirport}
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
        onOpenAirport={openHomeAirport}
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
        following={following}
        onToggleFollow={() => setFollowing((f) => !f)}
        airport={airport}
        isHomeAirport={airport?.icao === HOME_AIRPORT.icao}
        metar={metar}
        onCloseAirport={() => setAirportIcao(null)}
        onCenterAirport={centerAirport}
      />
    </div>
  );
}
