#!/usr/bin/env node
// Genera public/airports.json a partir del dataset abierto de OurAirports.
// Filtra a aeropuertos grandes y medianos con código ICAO válido y emite un
// JSON compacto { icao, iata, name, lat, lon }. Ejecutar: npm run build:airports
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SOURCE = 'https://davidmegginson.github.io/ourairports-data/airports.csv';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'airports.json');

/** Parser CSV mínimo que respeta comillas y comas internas. */
function parseCsvLine(line) {
  const out = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      out.push(field);
      field = '';
    } else field += c;
  }
  out.push(field);
  return out;
}

const ICAO_RE = /^[A-Z]{4}$/;

async function main() {
  console.log(`Descargando ${SOURCE} …`);
  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error(`HTTP ${res.status} al descargar OurAirports`);
  const text = await res.text();

  const lines = text.split('\n').filter(Boolean);
  const header = parseCsvLine(lines[0]);
  const col = (name) => header.indexOf(name);
  const iType = col('type');
  const iName = col('name');
  const iLat = col('latitude_deg');
  const iLon = col('longitude_deg');
  const iIdent = col('ident');
  const iGps = col('gps_code');
  const iIata = col('iata_code');

  const keepTypes = new Set(['large_airport', 'medium_airport']);
  const airports = [];
  for (let i = 1; i < lines.length; i++) {
    const f = parseCsvLine(lines[i]);
    if (!keepTypes.has(f[iType])) continue;
    const icao = (f[iGps] || f[iIdent] || '').toUpperCase();
    if (!ICAO_RE.test(icao)) continue;
    const lat = Number(f[iLat]);
    const lon = Number(f[iLon]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    airports.push({
      icao,
      iata: (f[iIata] || '').toUpperCase(),
      name: f[iName],
      lat: Math.round(lat * 1e4) / 1e4,
      lon: Math.round(lon * 1e4) / 1e4,
    });
  }

  airports.sort((a, b) => a.icao.localeCompare(b.icao));
  await writeFile(OUT, JSON.stringify(airports));
  console.log(`Escritos ${airports.length} aeropuertos en ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
