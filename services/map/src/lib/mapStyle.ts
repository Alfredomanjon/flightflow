import type { Map as MlMap } from 'maplibre-gl';

type Palette = {
  land: string;
  park: string;
  forest: string;
  residential: string;
  water: string;
  road: string;
  roadCasing: string;
  motorway: string;
  motorwayCasing: string;
  building: string;
  boundary: string;
  textPrimary: string;
  textHalo: string;
};

// Paleta neutra y desaturada: el mapa es el fondo, los aviones son los protagonistas.
export const LIGHT_PALETTE: Palette = {
  land:          '#eceef1',
  park:          '#dfe8d6',
  forest:        '#d6e3cb',
  residential:   '#e5e8ec',
  water:         '#c6dcf0',
  road:          '#ffffff',
  roadCasing:    '#dcdfe4',
  motorway:      '#fff3d1',
  motorwayCasing:'#e6d3a0',
  building:      '#e0e3e8',
  boundary:      '#9aa1ac',
  textPrimary:   '#6b7280',
  textHalo:      'rgba(255,255,255,0.9)',
};

export const DARK_PALETTE: Palette = {
  land:          '#1c1c1e',
  park:          '#1f2a22',
  forest:        '#1b261e',
  residential:   '#202023',
  water:         '#0d1b2e',
  road:          '#3a3a3c',
  roadCasing:    '#2a2a2c',
  motorway:      '#5a4a20',
  motorwayCasing:'#3a3016',
  building:      '#262629',
  boundary:      '#58585c',
  textPrimary:   '#8e8e93',
  textHalo:      'rgba(0,0,0,0.85)',
};

function set(map: MlMap, id: string, prop: string, val: unknown) {
  try { map.setPaintProperty(id, prop, val as never); } catch { /* ignore */ }
}

/**
 * Aplica la paleta correcta sobre el estilo Positron de OpenFreeMap.
 * Compatible con los layer IDs reales: background, water, park,
 * landcover_wood, landuse_residential, building, waterway,
 * highway_*, boundary_*.
 */
export function applyMapPalette(map: MlMap, dark: boolean): void {
  const p = dark ? DARK_PALETTE : LIGHT_PALETTE;
  const style = map.getStyle();
  if (!style?.layers) return;

  for (const layer of style.layers) {
    const id = layer.id;
    const t  = layer.type;

    // No tocar nuestras propias capas (iconos y cards de aviones)
    if (id.startsWith('aircraft-')) continue;

    // ── Fondo ──────────────────────────────────────────────
    if (t === 'background') {
      set(map, id, 'background-color', p.land);
      continue;
    }

    // ── Fills ──────────────────────────────────────────────
    if (t === 'fill') {
      if (id === 'water') {
        set(map, id, 'fill-color', p.water);
        set(map, id, 'fill-opacity', 1);
      } else if (id === 'park') {
        set(map, id, 'fill-color', p.park);
      } else if (id.startsWith('landcover_wood') || id.startsWith('landcover_glacier') || id.startsWith('landcover_ice')) {
        set(map, id, 'fill-color', p.forest);
      } else if (id.startsWith('landuse_residential')) {
        set(map, id, 'fill-color', p.residential);
      } else if (id === 'building') {
        set(map, id, 'fill-color', p.building);
        set(map, id, 'fill-opacity', 0.85);
      } else if (id.startsWith('aeroway')) {
        set(map, id, 'fill-color', dark ? '#2a2a2c' : '#ffffff');
      }
    }

    // ── Lines ──────────────────────────────────────────────
    if (t === 'line') {
      if (id === 'waterway') {
        set(map, id, 'line-color', p.water);
      } else if (id.startsWith('highway_motorway') || id.startsWith('tunnel_motorway')) {
        set(map, id, 'line-color', id.includes('casing') ? p.motorwayCasing : p.motorway);
      } else if (id.startsWith('highway_') || id.startsWith('tunnel_')) {
        set(map, id, 'line-color', id.includes('casing') ? p.roadCasing : p.road);
      } else if (id.startsWith('boundary_') || id === 'boundary_disputed') {
        set(map, id, 'line-color', p.boundary);
        set(map, id, 'line-opacity', 0.6);
      } else if (id.startsWith('railway')) {
        set(map, id, 'line-color', dark ? '#3a3a3c' : '#d4d7dc');
      } else if (id.startsWith('aeroway')) {
        set(map, id, 'line-color', dark ? '#3a3a3c' : '#ffffff');
      }
    }

    // ── Labels ─────────────────────────────────────────────
    if (t === 'symbol') {
      set(map, id, 'text-color', p.textPrimary);
      set(map, id, 'text-halo-color', p.textHalo);
      set(map, id, 'text-halo-width', 1.4);
    }
  }
}
