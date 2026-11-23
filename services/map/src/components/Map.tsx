import { useEffect, useRef } from 'react';
import maplibregl, { Map as MlMap, GeoJSONSource } from 'maplibre-gl';
import { cleanCallsign, distanceKm, type Aircraft } from '@flightflow/shared';
import { CALLSIGN_RADIUS_KM, HOME_AIRPORT, MAP_STYLE, NEARBY_RADIUS_KM, RECEIVER } from '../config';
import { applyMapPalette } from '../lib/mapStyle';
import { nearbyAirports } from '../data/airports';
import type { CallsignMode } from '../hooks/useCallsignMode';
import type { ViewMode } from '../hooks/useViewMode';
import {
  ICON_KINDS,
  classifyAircraft,
  planeSvgForKind,
  type AircraftIconKind,
} from '../lib/aircraftIcon';

interface Props {
  aircraft: Aircraft[];
  selectedHex: string | null;
  onSelect: (hex: string | null) => void;
  darkMode: boolean;
  trail: [number, number][] | null;
  trailVersion: number;
  callsignMode: CallsignMode;
  viewMode: ViewMode;
  onMapReady?: (map: MlMap) => void;
  /** Hex del avión que la cámara debe seguir (null = libre). */
  followHex?: string | null;
  /** El usuario movió el mapa a mano: dejar de seguir. */
  onStopFollow?: () => void;
  onAirportSelect?: (icao: string) => void;
}

// Registra los 5 sprites (uno por familia visual) con la paleta del modo.
async function registerPlaneImages(map: MlMap, dark: boolean) {
  await Promise.all(
    ICON_KINDS.flatMap((kind) =>
      [false, true].map(async (selected) => {
        const img = await svgToImage(planeSvgForKind(kind, dark, selected));
        const name = `plane-${kind}${selected ? '-sel' : ''}`;
        if (map.hasImage(name)) map.removeImage(name);
        map.addImage(name, img);
      }),
    ),
  );
  if (map.getLayer('aircraft-icons')) map.triggerRepaint();
}

function svgToImage(svg: string, size = 64): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image(size, size);
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = 'data:image/svg+xml;base64,' + btoa(svg);
  });
}

// ─── GeoJSON ──────────────────────────────────────────────────────────────────
function aircraftToGeoJSON(
  aircraft: Aircraft[],
  selectedHex: string | null,
  callsignMode: CallsignMode,
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: aircraft
      .filter((a) => typeof a.lat === 'number' && typeof a.lon === 'number')
      .map((a) => {
        const callsign = cleanCallsign(a.flight) || a.hex.toUpperCase();
        const reg = a.r ?? '—';
        const type = a.t ?? a.category ?? '—';
        const nearHome =
          distanceKm(HOME_AIRPORT.lat, HOME_AIRPORT.lon, a.lat!, a.lon!) < CALLSIGN_RADIUS_KM
            ? 1
            : 0;
        const kind: AircraftIconKind = classifyAircraft(a.t, a.category);
        const isSelected = a.hex === selectedHex;
        // La etiqueta del seleccionado va en una card HTML aparte.
        const showLabel = !isSelected && (callsignMode === 'all' || (callsignMode === 'nearby' && nearHome === 1));
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [a.lon!, a.lat!] },
          properties: {
            hex: a.hex,
            callsign,
            meta: `${reg} · ${type}`,
            rotate: a.track ?? a.true_heading ?? a.mag_heading ?? 0,
            selected: isSelected ? 1 : 0,
            nearHome,
            label: showLabel ? callsign : '',
            iconImage: `plane-${kind}${isSelected ? '-sel' : ''}`,
          },
        };
      }),
  };
}

// ─── Aeropuertos ─────────────────────────────────────────────────────────────
function airportsGeoJSON(): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: nearbyAirports(RECEIVER, NEARBY_RADIUS_KM).map((a) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [a.lon, a.lat] },
      properties: {
        icao: a.icao,
        iata: a.iata,
        name: a.name,
        home: a.icao === HOME_AIRPORT.icao ? 1 : 0,
      },
    })),
  };
}

function addAirportLayers(map: MlMap, dark: boolean, beforeId?: string) {
  // Halo del dot (anillo translúcido — más grande para el "home")
  map.addLayer({
    id: 'airports-halo',
    type: 'circle',
    source: 'airports',
    paint: {
      'circle-radius': ['case', ['==', ['get', 'home'], 1], 12, 9],
      'circle-color': dark ? '#0A84FF' : '#007AFF',
      'circle-opacity': 0.18,
      'circle-stroke-width': 0,
    },
  }, beforeId);

  // Dot principal
  map.addLayer({
    id: 'airports-dot',
    type: 'circle',
    source: 'airports',
    paint: {
      'circle-radius': ['case', ['==', ['get', 'home'], 1], 5, 4],
      'circle-color': ['case', ['==', ['get', 'home'], 1],
        '#FF9F0A',
        (dark ? '#0A84FF' : '#007AFF'),
      ],
      'circle-stroke-width': 1.5,
      'circle-stroke-color': dark ? '#000000' : '#ffffff',
    },
  }, beforeId);

  // Etiqueta ICAO
  map.addLayer({
    id: 'airports-label',
    type: 'symbol',
    source: 'airports',
    layout: {
      'text-field': ['get', 'icao'],
      'text-font': ['Noto Sans Bold'],
      'text-size': 11,
      'text-offset': [0.9, 0],
      'text-anchor': 'left',
      'text-allow-overlap': false,
      'text-ignore-placement': false,
      'symbol-sort-key': ['case', ['==', ['get', 'home'], 1], -1, 0],
    },
    paint: {
      'text-color': dark ? '#d1d1d6' : '#374151',
      'text-halo-color': dark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.92)',
      'text-halo-width': 1.4,
    },
  }, beforeId);
}

function updateAirportLayers(map: MlMap, dark: boolean) {
  if (!map.getLayer('airports-dot')) return;
  map.setPaintProperty('airports-halo', 'circle-color', dark ? '#0A84FF' : '#007AFF');
  map.setPaintProperty('airports-dot', 'circle-color', [
    'case', ['==', ['get', 'home'], 1],
    '#FF9F0A',
    (dark ? '#0A84FF' : '#007AFF'),
  ]);
  map.setPaintProperty('airports-dot', 'circle-stroke-color',
    dark ? '#000000' : '#ffffff');
  map.setPaintProperty('airports-label', 'text-color', dark ? '#d1d1d6' : '#374151');
  map.setPaintProperty('airports-label', 'text-halo-color',
    dark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.92)');
}

// ─── Componente ───────────────────────────────────────────────────────────────
export function Map({
  aircraft,
  selectedHex,
  onSelect,
  darkMode,
  trail,
  trailVersion,
  callsignMode,
  viewMode,
  onMapReady,
  followHex = null,
  onStopFollow,
  onAirportSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const readyRef = useRef(false);
  const darkModeRef = useRef(darkMode);
  const onSelectRef = useRef(onSelect);
  const aircraftRef = useRef<Aircraft[]>(aircraft);
  const followedHexRef = useRef<string | null>(null);
  const onAirportSelectRef = useRef(onAirportSelect);
  onAirportSelectRef.current = onAirportSelect;
  const onStopFollowRef = useRef(onStopFollow);
  onStopFollowRef.current = onStopFollow;
  const onMapReadyRef = useRef(onMapReady);
  onMapReadyRef.current = onMapReady;
  onSelectRef.current = onSelect;
  darkModeRef.current = darkMode;
  aircraftRef.current = aircraft;

  // Prop change → re-apply (backup del MutationObserver)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    applyMapPalette(map, darkMode);
    updateAirportLayers(map, darkMode);
    void registerPlaneImages(map, darkMode);
    if (map.getLayer('aircraft-labels')) {
      map.setPaintProperty('aircraft-labels', 'text-color', darkMode ? '#ffffff' : '#111827');
      map.setPaintProperty('aircraft-labels', 'text-halo-color', darkMode ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)');
    }
    if (map.getLayer('trail-line')) {
      const color = darkMode ? '#0A84FF' : '#007AFF';
      map.setPaintProperty('trail-line', 'line-color', color);
      map.setPaintProperty('trail-glow', 'line-color', color);
    }
  }, [darkMode]);

  // Actualiza la geometría del trail al seleccionar avión o al recibir puntos nuevos
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const src = map.getSource('trail') as GeoJSONSource | undefined;
    if (!src) return;
    if (!trail || trail.length < 2) {
      src.setData({ type: 'FeatureCollection', features: [] });
      return;
    }
    src.setData({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: trail },
        properties: {},
      }],
    });
  }, [trail, trailVersion]);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [RECEIVER.lon, RECEIVER.lat],
      zoom: 8,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    (window as unknown as { __map?: MlMap }).__map = map;

    // MutationObserver: detecta cambio de clase 'dark' en <html>
    const observer = new MutationObserver(() => {
      if (!mapRef.current || !readyRef.current) return;
      const isDark = document.documentElement.classList.contains('dark');
      applyMapPalette(mapRef.current, isDark);
      updateAirportLayers(mapRef.current, isDark);
      void registerPlaneImages(mapRef.current, isDark);
      if (mapRef.current.getLayer('aircraft-labels')) {
        mapRef.current.setPaintProperty('aircraft-labels', 'text-color', isDark ? '#ffffff' : '#111827');
        mapRef.current.setPaintProperty('aircraft-labels', 'text-halo-color', isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)');
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    map.on('load', async () => {
      const isDark = document.documentElement.classList.contains('dark');
      applyMapPalette(map, isDark);

      // Icono del avión (paleta sensible al modo claro/oscuro)
      await registerPlaneImages(map, isDark);

      // Fuente de aeropuertos
      map.addSource('airports', {
        type: 'geojson',
        data: airportsGeoJSON(),
      });

      // Capas de aeropuertos — debajo de los aviones
      addAirportLayers(map, isDark);

      // Fuente + capa de trayectoria (solo se rellena al seleccionar avión)
      map.addSource('trail', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'trail-glow',
        type: 'line',
        source: 'trail',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': isDark ? '#0A84FF' : '#007AFF',
          'line-width': 7,
          'line-opacity': 0.18,
          'line-blur': 2,
        },
      });
      map.addLayer({
        id: 'trail-line',
        type: 'line',
        source: 'trail',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': isDark ? '#0A84FF' : '#007AFF',
          'line-width': 2.5,
          'line-opacity': 0.9,
        },
      });

      // Fuente de datos
      map.addSource('aircraft', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Capa de iconos (los callsigns van como HTML markers — ver useEffect aparte)
      map.addLayer({
        id: 'aircraft-icons',
        type: 'symbol',
        source: 'aircraft',
        layout: {
          'icon-image': ['get', 'iconImage'] as never,
          // Crece al acercar el zoom: de 5 a 12 el icono pasa de ~0,5 a ~0,9 de su tamaño.
          'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.5, 9, 0.68, 12, 0.9] as never,
          'icon-rotate': ['get', 'rotate'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
        },
      });

      // Callsign pegado al icono (texto con halo; sin tarjeta, como en un radar)
      map.addLayer({
        id: 'aircraft-labels',
        type: 'symbol',
        source: 'aircraft',
        minzoom: 6,
        layout: {
          'text-field': ['get', 'label'],
          'text-font': ['Noto Sans Bold'],
          'text-size': 11,
          'text-anchor': 'left',
          'text-offset': [1.3, 0],
          'text-optional': true,
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': isDark ? '#ffffff' : '#111827',
          'text-halo-color': isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)',
          'text-halo-width': 1.6,
        },
      });

      // Clicks (las cards HTML manejan su propio click)
      const clickableLayers = ['aircraft-icons'];
      for (const layer of clickableLayers) {
        map.on('click', layer, (e) => {
          const f = e.features?.[0];
          if (f) onSelectRef.current(String(f.properties?.hex ?? ''));
          e.originalEvent.stopPropagation();
        });
      }
      map.on('click', (e) => {
        const hits = map.queryRenderedFeatures(e.point, { layers: clickableLayers });
        if (hits.length === 0) onSelectRef.current(null);
      });

      // Clic en un aeropuerto: abre su panel (los aviones tienen prioridad si coinciden).
      map.on('click', 'airports-halo', (e) => {
        const hitsAircraft = map.queryRenderedFeatures(e.point, { layers: clickableLayers });
        if (hitsAircraft.length > 0) return;
        const icao = e.features?.[0]?.properties?.icao;
        if (icao) onAirportSelectRef.current?.(String(icao));
      });
      map.on('mouseenter', 'airports-halo', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'airports-halo', () => { map.getCanvas().style.cursor = ''; });

      for (const layer of clickableLayers) {
        map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
      }

      // Arrastrar el mapa a mano cancela el seguimiento (los movimientos del código no traen originalEvent).
      map.on('dragstart', () => onStopFollowRef.current?.());

      readyRef.current = true;
      onMapReadyRef.current?.(map);
    });

    return () => {
      observer.disconnect();
      readyRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Actualizar datos GeoJSON (incluye la propiedad `selected` derivada del hex)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const src = map.getSource('aircraft') as GeoJSONSource | undefined;
    if (src) src.setData(aircraftToGeoJSON(aircraft, selectedHex, callsignMode));
  }, [aircraft, selectedHex, callsignMode]);

  // ── Card HTML solo para el avión seleccionado (el resto lleva etiqueta GL).
  const markerRef = useRef<maplibregl.Marker | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    const a = selectedHex ? aircraft.find((x) => x.hex === selectedHex) : undefined;
    if (!a || typeof a.lat !== 'number' || typeof a.lon !== 'number') {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    let marker = markerRef.current;
    if (!marker) {
      const el = document.createElement('div');
      el.className = 'aircraft-card-html aircraft-card-html--selected';
      el.innerHTML = `
        <div class="aircraft-card-html__callsign"></div>
        <div class="aircraft-card-html__meta"></div>
      `;
      marker = new maplibregl.Marker({ element: el, anchor: 'left', offset: [24, 0] })
        .setLngLat([a.lon, a.lat])
        .addTo(map);
      markerRef.current = marker;
    } else {
      marker.setLngLat([a.lon, a.lat]);
    }

    const el = marker.getElement();
    const callsign = cleanCallsign(a.flight) || a.hex.toUpperCase();
    const meta = `${a.r ?? '—'} · ${a.t ?? a.category ?? '—'}`;
    const cs = el.querySelector('.aircraft-card-html__callsign');
    const mt = el.querySelector('.aircraft-card-html__meta');
    if (cs && cs.textContent !== callsign) cs.textContent = callsign;
    if (mt && mt.textContent !== meta) mt.textContent = meta;
  }, [aircraft, selectedHex]);

  // Cleanup global al desmontar
  useEffect(() => {
    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
    };
  }, []);

  // ── Autoplay: rota foco entre aviones y aeropuerto ─────────────────────────
  useEffect(() => {
    if (viewMode !== 'autoplay') return;
    const map = mapRef.current;
    if (!map) return;

    const FLY_INTERVAL_MS = 16000;    // tiempo por escena (antes 8 s)
    const FLY_DURATION_MS = 2800;     // duración del flyTo (suave)
    const HOME_EVERY = 5;             // 1 de cada N escenas va al aeropuerto base
    const AIRCRAFT_ZOOM = 10.5;
    const HOME_ZOOM = 9;
    const FOLLOW_ENABLE_DELAY_MS = FLY_DURATION_MS + 200;

    let tick = 0;
    let followTimer: number | null = null;

    // Mantenemos un índice rotatorio independiente de la lista (que cambia
    // cada segundo) — guardamos el último hex visitado para reanudar tras él.
    let lastHex: string | null = null;

    const pickNextAircraft = (): Aircraft | null => {
      const list = aircraftRef.current.filter(
        (a) => typeof a.lat === 'number' && typeof a.lon === 'number',
      );
      if (list.length === 0) return null;
      const sorted = [...list].sort((a, b) => a.hex.localeCompare(b.hex));
      if (lastHex == null) return sorted[0];
      const idx = sorted.findIndex((a) => a.hex > lastHex!);
      return idx === -1 ? sorted[0] : sorted[idx];
    };

    const fly = () => {
      const mapNow = mapRef.current;
      if (!mapNow) return;

      // Durante la transición no perseguimos; reactivamos cuando el flyTo termine.
      followedHexRef.current = null;
      if (followTimer != null) window.clearTimeout(followTimer);

      const goHome = tick % HOME_EVERY === 0;
      if (goHome) {
        onSelectRef.current(null);
        mapNow.flyTo({
          center: [HOME_AIRPORT.lon, HOME_AIRPORT.lat],
          zoom: HOME_ZOOM,
          duration: FLY_DURATION_MS,
          essential: true,
          curve: 1.4,
        });
      } else {
        const target = pickNextAircraft();
        if (!target) {
          mapNow.flyTo({
            center: [HOME_AIRPORT.lon, HOME_AIRPORT.lat],
            zoom: HOME_ZOOM,
            duration: FLY_DURATION_MS,
            essential: true,
            curve: 1.4,
          });
        } else {
          lastHex = target.hex;
          onSelectRef.current(target.hex);
          mapNow.flyTo({
            center: [target.lon!, target.lat!],
            zoom: AIRCRAFT_ZOOM,
            duration: FLY_DURATION_MS,
            essential: true,
            curve: 1.4,
          });
          // Activamos persecución una vez la animación inicial termine
          followTimer = window.setTimeout(() => {
            followedHexRef.current = target.hex;
          }, FOLLOW_ENABLE_DELAY_MS);
        }
      }
      tick += 1;
    };

    // Arranca con foco a casa (escena 0 = home), luego cada N segundos
    fly();
    const id = window.setInterval(fly, FLY_INTERVAL_MS);
    return () => {
      window.clearInterval(id);
      if (followTimer != null) window.clearTimeout(followTimer);
      followedHexRef.current = null;
      // Al salir del modo, quitamos selección automática
      onSelectRef.current(null);
    };
  }, [viewMode]);

  // Seguimiento manual (botón «Seguir»): centra la cámara en el avión en cada actualización.
  useEffect(() => {
    if (!followHex) return;
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const target = aircraft.find((a) => a.hex === followHex);
    if (!target || typeof target.lat !== 'number' || typeof target.lon !== 'number') return;
    map.easeTo({ center: [target.lon, target.lat], duration: 900, essential: true });
  }, [aircraft, followHex]);

  // Persecución suave del avión en autoplay: cada vez que aircraft.json trae
  // nueva posición, deslizamos la cámara al nuevo punto sin cambiar el zoom.
  useEffect(() => {
    if (viewMode !== 'autoplay') return;
    const hex = followedHexRef.current;
    if (!hex) return;
    const target = aircraft.find((a) => a.hex === hex);
    if (!target || typeof target.lat !== 'number' || typeof target.lon !== 'number') return;
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    map.panTo([target.lon, target.lat], { duration: 900, essential: true });
  }, [aircraft, viewMode]);

  // `isolation: isolate` crea un stacking context aislado — el z-index de los
  // markers HTML interno se queda dentro y no compite con las cards de UI.
  return <div ref={containerRef} className="absolute inset-0" style={{ isolation: 'isolate' }} />;
}
