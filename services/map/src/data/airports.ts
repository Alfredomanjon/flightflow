import { distanceKm } from '@flightflow/shared';

export interface Airport {
  icao: string;
  iata: string;
  name: string;
  lat: number;
  lon: number;
}

// Dataset mundial de aeropuertos (generado con `npm run build:airports` desde
// OurAirports). Se carga en runtime desde /airports.json para no inflar el bundle.
let AIRPORTS: Airport[] = [];

/** Carga el dataset estático de aeropuertos. Llamar una vez al arrancar. */
export async function loadAirports(): Promise<void> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}airports.json`, { cache: 'force-cache' });
    if (res.ok) {
      AIRPORTS = (await res.json()) as Airport[];
    } else {
      console.warn(`airports.json HTTP ${res.status} — el mapa no mostrará aeropuertos`);
    }
  } catch (err) {
    console.warn('No se pudo cargar airports.json', err);
  }
}

/** Busca un aeropuerto por código ICAO (case-insensitive). */
export function findAirport(icao: string): Airport | undefined {
  const upper = icao.toUpperCase();
  return AIRPORTS.find((a) => a.icao === upper);
}

/** Aeropuertos dentro de `radiusKm` del receptor, ordenados por cercanía. */
export function nearbyAirports(
  receiver: { lat: number; lon: number },
  radiusKm: number,
): Airport[] {
  return AIRPORTS
    .map((a) => ({ a, d: distanceKm(receiver.lat, receiver.lon, a.lat, a.lon) }))
    .filter(({ d }) => d <= radiusKm)
    .sort((x, y) => x.d - y.d)
    .map(({ a }) => a);
}
