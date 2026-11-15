import { t } from '../i18n';

// ICAO type → side-profile drawing in ./aircraft.
// There are 18 drawings; other types use the closest one.

export const ART_KEYS = [
  'A319', 'A320', 'A321', 'A20N', 'A21N',
  'B738', 'B739', 'B38M', 'B39M',
  'B788', 'B789', 'A359',
  'E190', 'CRJ9', 'AT72',
  'BJET', 'C172', 'HELI',
] as const;
export type ArtKey = (typeof ART_KEYS)[number];

/** Marketing name of each drawing (from the SVG <title>). */
export const ART_NAMES: Record<ArtKey, string> = {
  A319: 'Airbus A319',
  A320: 'Airbus A320ceo',
  A321: 'Airbus A321ceo',
  A20N: 'Airbus A320neo',
  A21N: 'Airbus A321neo',
  B738: 'Boeing 737-800',
  B739: 'Boeing 737-900ER',
  B38M: 'Boeing 737 MAX 8',
  B39M: 'Boeing 737 MAX 9',
  B788: 'Boeing 787-8',
  B789: 'Boeing 787-9',
  A359: 'Airbus A350-900',
  E190: 'Embraer E190',
  CRJ9: 'Bombardier CRJ900',
  AT72: 'ATR 72',
  BJET: 'Business jet',
  C172: 'Cessna 172',
  HELI: 'Light helicopter',
};

/** Names of frequent types without their own drawing. */
const TYPE_NAMES: Record<string, string> = {
  A318: 'Airbus A318', A332: 'Airbus A330-200', A333: 'Airbus A330-300',
  A338: 'Airbus A330-800neo', A339: 'Airbus A330-900neo', A35K: 'Airbus A350-1000',
  A388: 'Airbus A380', BCS1: 'Airbus A220-100', BCS3: 'Airbus A220-300',
  B736: 'Boeing 737-600', B737: 'Boeing 737-700', B739: 'Boeing 737-900',
  B37M: 'Boeing 737 MAX 7', B39M: 'Boeing 737 MAX 9', B3XM: 'Boeing 737 MAX 10',
  B752: 'Boeing 757-200', B763: 'Boeing 767-300', B772: 'Boeing 777-200',
  B77W: 'Boeing 777-300ER', B788: 'Boeing 787-8', B78X: 'Boeing 787-10',
  B744: 'Boeing 747-400', B748: 'Boeing 747-8',
  E170: 'Embraer E170', E175: 'Embraer E175', E195: 'Embraer E195',
  E290: 'Embraer E190-E2', E295: 'Embraer E195-E2',
  CRJ2: 'Bombardier CRJ200', CRJ7: 'Bombardier CRJ700', CRJX: 'Bombardier CRJ1000',
  AT43: 'ATR 42-300', AT45: 'ATR 42-500', AT75: 'ATR 72-500', AT76: 'ATR 72-600',
  DH8D: 'De Havilland Dash 8-400',
};

const MAP: Record<string, ArtKey> = {};
const add = (art: ArtKey, codes: string[]) => codes.forEach((c) => (MAP[c] = art));

add('B738', ['B731', 'B732', 'B733', 'B734', 'B735', 'B736', 'B737', 'B73G', 'B73H']);
add('B739', ['B73J', 'B752', 'B753']);
add('B38M', ['B37M', 'B3JM']);
add('B39M', ['B3XM']);
add('A319', ['A318', 'A19N']);
add('E190', ['BCS1', 'BCS3', 'A221', 'A223', 'E170', 'E175', 'E195', 'E290', 'E295', 'E75L', 'E75S']);
add('CRJ9', ['CRJ1', 'CRJ2', 'CRJ7', 'CRJX', 'E135', 'E145', 'E45X', 'F100', 'F70']);
add('AT72', ['AT43', 'AT44', 'AT45', 'AT46', 'AT73', 'AT75', 'AT76', 'DH8A', 'DH8B', 'DH8C', 'DH8D', 'SF34', 'D328', 'J41']);
add('B788', ['B762', 'B763', 'B764']);
add('B789', [
  'B78X', 'B772', 'B773', 'B77L', 'B77W', 'B778', 'B779',
  'B742', 'B744', 'B748', 'A332', 'A333', 'A338', 'A339', 'A306', 'A310', 'A388', 'MD11',
]);
add('C172', ['C150', 'C152', 'C162', 'C170', 'C175', 'C177', 'C180', 'C182', 'C185', 'C206', 'C208', 'C210', 'P28A', 'P28B', 'P28R', 'PA24', 'PA32', 'PA46', 'SR20', 'SR22', 'DA20', 'DA40', 'DA42', 'M20P', 'BE33', 'BE35', 'BE36', 'TB20', 'TB10', 'PC12', 'TBM7', 'TBM8', 'TBM9', 'RV7', 'RV8'])
add('A359', ['A35K', 'A342', 'A343', 'A345', 'A346']);

// Families for the fallback (subset of the map's aircraftIcon.ts).
const HELI_PREFIX = ['R22', 'R44', 'R66', 'EC', 'AS3', 'AS5', 'AS6', 'H1', 'H2', 'B06', 'B4', 'A109', 'A119', 'A139', 'A169', 'S76', 'S92'];
const BIZ_PREFIX = [
  'C25', 'C50', 'C51', 'C52', 'C55', 'C56', 'C68', 'C75', 'CL3', 'CL6', 'GLF', 'GLEX', 'GL5T', 'GL7T',
  'G280', 'LJ', 'F900', 'FA', 'F2TH', 'E50P', 'E55P', 'E545', 'E550', 'HA4T', 'H25', 'PC24', 'PRM1',
];
const LIGHT_PREFIX = ['C1', 'C2', 'PA', 'P28', 'P32', 'BE', 'M20', 'SR2', 'DA', 'TBM', 'TB', 'PC6', 'PC12', 'RV'];

export interface ArtChoice {
  art: ArtKey;
  /** True when the drawing is exactly the aircraft's type. */
  exact: boolean;
}

export function artFor(type?: string | null, category?: string | null): ArtChoice {
  const t = (type ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if ((ART_KEYS as readonly string[]).includes(t)) return { art: t as ArtKey, exact: true };
  if (MAP[t]) return { art: MAP[t], exact: false };

  const starts = (list: string[]) => list.some((p) => t.startsWith(p));
  if (category === 'A5') return { art: 'B789', exact: false };
  if (category === 'A7' || (t && starts(HELI_PREFIX))) return { art: 'HELI', exact: false };
  if (t && starts(BIZ_PREFIX)) return { art: 'BJET', exact: false };
  if (t && starts(LIGHT_PREFIX)) return { art: 'C172', exact: false };
  if (category === 'A1') return { art: 'C172', exact: false };
  if (category === 'A2') return { art: 'CRJ9', exact: false };
  return { art: 'A320', exact: false };
}

export function typeName(type?: string | null, fallback?: string): string {
  const code = (type ?? '').toUpperCase();
  if ((ART_KEYS as readonly string[]).includes(code)) return ART_NAMES[code as ArtKey];
  return TYPE_NAMES[code] ?? fallback ?? (code || t('common.unknownType'));
}
