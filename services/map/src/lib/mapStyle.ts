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

export const LIGHT_PALETTE: Palette = {
  land:          '#bce5a0',
  park:          '#9fd684',
  forest:        '#94cf77',
  residential:   '#aedb91',
  water:         '#7fbfe6',
  road:          '#ffffff',
  roadCasing:    '#d4e6cc',
  motorway:      '#ffe8a3',
  motorwayCasing:'#e8c98a',
  building:      '#dfe7d7',
  boundary:      '#8ba398',
  textPrimary:   '#3f4661',
  textHalo:      'rgba(255,255,255,0.9)',
};

export const DARK_PALETTE: Palette = {
  land:          '#2d6b3e',
  park:          '#1f5029',
  forest:        '#1a4524',
  residential:   '#265835',
  water:         '#0c1d50',
  road:          '#d8e4e0',
  roadCasing:    '#1a5030',
  motorway:      '#f0e070',
  motorwayCasing:'#9a8020',
  building:      '#3a6545',
  boundary:      '#4a7060',
  textPrimary:   '#ffffff',
  textHalo:      'rgba(15,50,28,0.9)',
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
        set(map, id, 'fill-color', dark ? '#3a6040' : 'rgba(255,255,255,1)');
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
        set(map, id, 'line-color', dark ? '#4a7060' : '#dddddd');
      } else if (id.startsWith('aeroway')) {
        set(map, id, 'line-color', dark ? '#3a6545' : 'rgba(255,255,255,1)');
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
