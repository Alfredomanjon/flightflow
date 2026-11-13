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
}

// Registra los 5 sprites (uno por familia visual) con la paleta del modo.
async function registerPlaneImages(map: MlMap, dark: boolean) {
  await Promise.all(
    ICON_KINDS.map(async (kind) => {
      const img = await svgToImage(planeSvgForKind(kind, dark));
      const name = `plane-${kind}`;
      if (map.hasImage(name)) map.removeImage(name);
      map.addImage(name, img);
    }),
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
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [a.lon!, a.lat!] },
          properties: {
            hex: a.hex,
            callsign,
            meta: `${reg} · ${type}`,
            rotate: a.track ?? a.true_heading ?? a.mag_heading ?? 0,
            selected: a.hex === selectedHex ? 1 : 0,
            nearHome,
            iconImage: `plane-${kind}`,
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
      'circle-color': dark ? '#9ab8ff' : '#123b89',
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
        (dark ? '#ffd166' : '#e08a00'),
        (dark ? '#9ab8ff' : '#123b89'),
      ],
      'circle-stroke-width': 1.5,
      'circle-stroke-color': dark ? 'rgba(15,17,32,0.85)' : 'rgba(255,255,255,0.95)',
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
      'text-color': dark ? '#cfd8e8' : '#1f2a44',
      'text-halo-color': dark ? 'rgba(15,17,32,0.85)' : 'rgba(255,255,255,0.92)',
      'text-halo-width': 1.4,
    },
  }, beforeId);
}

function updateAirportLayers(map: MlMap, dark: boolean) {
  if (!map.getLayer('airports-dot')) return;
  map.setPaintProperty('airports-halo', 'circle-color', dark ? '#9ab8ff' : '#123b89');
  map.setPaintProperty('airports-dot', 'circle-color', [
    'case', ['==', ['get', 'home'], 1],
    (dark ? '#ffd166' : '#e08a00'),
    (dark ? '#9ab8ff' : '#123b89'),
  ]);
  map.setPaintProperty('airports-dot', 'circle-stroke-color',
    dark ? 'rgba(15,17,32,0.85)' : 'rgba(255,255,255,0.95)');
  map.setPaintProperty('airports-label', 'text-color', dark ? '#cfd8e8' : '#1f2a44');
  map.setPaintProperty('airports-label', 'text-halo-color',
    dark ? 'rgba(15,17,32,0.85)' : 'rgba(255,255,255,0.92)');
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
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const readyRef = useRef(false);
  const darkModeRef = useRef(darkMode);
  const onSelectRef = useRef(onSelect);
  const aircraftRef = useRef<Aircraft[]>(aircraft);
  const followedHexRef = useRef<string | null>(null);
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
    if (map.getLayer('trail-line')) {
      const color = darkMode ? '#9ab8ff' : '#123b89';
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
          'line-color': isDark ? '#9ab8ff' : '#123b89',
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
          'line-color': isDark ? '#9ab8ff' : '#123b89',
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
          'icon-size': 0.55,
          'icon-rotate': ['get', 'rotate'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
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

      for (const layer of clickableLayers) {
        map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
      }

      readyRef.current = true;
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
    if (src) src.setData(aircraftToGeoJSON(aircraft, selectedHex));
  }, [aircraft, selectedHex]);

  // ── Markers HTML para los callsigns (Liquid Glass real con backdrop-filter)
  // Usamos globalThis.Map para evitar colisión con el nombre de la función `Map`.
  const markersRef = useRef<globalThis.Map<string, maplibregl.Marker>>(new globalThis.Map());
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    const seen = new Set<string>();
    for (const a of aircraft) {
      if (typeof a.lat !== 'number' || typeof a.lon !== 'number') continue;
      seen.add(a.hex);

      const nearHome =
        distanceKm(HOME_AIRPORT.lat, HOME_AIRPORT.lon, a.lat, a.lon) < CALLSIGN_RADIUS_KM;
      const isSelected = a.hex === selectedHex;
      const shouldShow =
        isSelected ||
        callsignMode === 'all' ||
        (callsignMode === 'nearby' && nearHome);

      const callsign = cleanCallsign(a.flight) || a.hex.toUpperCase();
      const reg = a.r ?? '—';
      const type = a.t ?? a.category ?? '—';
      const meta = `${reg} · ${type}`;

      let marker = markersRef.current.get(a.hex);
      if (!marker) {
        const el = document.createElement('div');
        el.className = 'aircraft-card-html glass';
        el.innerHTML = `
          <div class="aircraft-card-html__callsign"></div>
          <div class="aircraft-card-html__meta"></div>
        `;
        const hex = a.hex;
        el.addEventListener('click', (ev) => {
          ev.stopPropagation();
          onSelectRef.current(hex);
        });
        marker = new maplibregl.Marker({
          element: el,
          anchor: 'left',
          offset: [22, 0],
        })
          .setLngLat([a.lon, a.lat])
          .addTo(map);
        markersRef.current.set(a.hex, marker);
      } else {
        marker.setLngLat([a.lon, a.lat]);
      }

      const el = marker.getElement();
      const cs = el.querySelector('.aircraft-card-html__callsign');
      const mt = el.querySelector('.aircraft-card-html__meta');
      if (cs && cs.textContent !== callsign) cs.textContent = callsign;
      if (mt && mt.textContent !== meta) mt.textContent = meta;
      el.classList.toggle('aircraft-card-html--selected', isSelected);
      el.style.display = shouldShow ? '' : 'none';
      el.style.zIndex = isSelected ? '2' : '1';
    }

    // Eliminar markers de aviones que han desaparecido
    for (const [hex, marker] of markersRef.current) {
      if (!seen.has(hex)) {
        marker.remove();
        markersRef.current.delete(hex);
      }
    }
  }, [aircraft, selectedHex, callsignMode]);

  // Cleanup global al desmontar
  useEffect(() => {
    return () => {
      for (const marker of markersRef.current.values()) marker.remove();
      markersRef.current.clear();
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
