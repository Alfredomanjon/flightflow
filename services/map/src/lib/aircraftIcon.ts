// Clasificación de aviones por familia visual y generación de iconos SVG cenitales
// (vista desde arriba, morro hacia arriba). Cada familia tiene su propia silueta:
// motores bajo el ala, motores traseros, hélices, cuatro motores, etc.

export type AircraftIconKind =
  | 'narrow'    // A318–A321 / 757 y genérico de pasillo único
  | 'b737'      // familia Boeing 737
  | 'regional'  // E-Jets, A220: reactor pequeño con motores bajo el ala
  | 'rearjet'   // CRJ, ERJ, MD-80, 717, Superjet: motores traseros
  | 'turboprop' // ATR, Dash 8, Saab…
  | 'widebody'  // bimotor de fuselaje ancho (777, 787, A330, A350…)
  | 'quad'      // cuatro motores (747, A380, A340…)
  | 'biz'       // jets ejecutivos
  | 'light'     // aviación ligera de hélice
  | 'heli';

export const ICON_KINDS: AircraftIconKind[] = [
  'narrow', 'b737', 'regional', 'rearjet', 'turboprop', 'widebody', 'quad', 'biz', 'light', 'heli',
];

const QUAD = new Set([
  'A342','A343','A345','A346','A388','A380',
  'B741','B742','B743','B744','B748','B74D','B74F','B74R','B74S','BLCF',
  'A124','IL96','IL76','C17','C5M','A400','B52',
]);

const WIDEBODY = new Set([
  'A332','A333','A338','A339','A337','A3ST','A359','A35K','A310','A306','A30B','A300','A30F','A30W',
  'B762','B763','B764','B76F','B772','B773','B77L','B77W','B778','B779','B77F',
  'B788','B789','B78X','B787','B783','MD11','DC10','L101','IL86',
]);

const B737 = new Set([
  'B731','B732','B733','B734','B735','B736','B737','B738','B739',
  'B73G','B73H','B73J','B73K','B73L','B73M','B73N','B37M','B38M','B39M','B3XM',
]);

const NARROW = new Set([
  'A318','A319','A320','A321','A19N','A20N','A21N','B752','B753','B757',
]);

// Reactores regionales con motores bajo el ala
const REGIONAL = new Set([
  'A220','A221','A223','BCS1','BCS3',
  'E170','E175','E190','E195','E290','E295','E75L','E75S','E7W',
  'B461','B462','B463',
]);

// Reactores con motores en el fuselaje trasero
const REARJET = new Set([
  'CRJ1','CRJ2','CRJ200','CRJ7','CRJ9','CRJX','CRJ10',
  'E135','E140','E145','E35L','E45X',
  'MD80','MD81','MD82','MD83','MD87','MD88','MD90','MD95',
  'B712','DC91','DC92','DC93','DC94','DC95','B721','B722','F28','F70','F100','F60',
  'SU95','SSJ','SSJ100','BA11','RJ70','RJ85','RJ1H',
]);

const TURBOPROP = new Set([
  'AT42','AT43','AT44','AT45','AT46','AT72','AT73','AT75','AT76','AT2','AT3','AT4','AT5','AT7',
  'DH8A','DH8B','DH8C','DH8D','DHC8','DH4','DH3','DHC6','DHC5',
  'SF34','SF50','SB20','SB05','J31','J32','J41','JS31','JS32','JS41',
  'BE99','BE19','BE20','B190','D228','D328','D38','F27','F50','E110','E120','SW4',
  'AN24','AN26','AN32','L410','C130','C30J','CN35','C295',
]);

const BIZ_PREFIX = [
  'C25','C56','C68','C50','C51','C52','C55','C560','C650','C680','C750',
  'CCJ','CCX','CL30','CL35','CL60','CL64','CL65','CL70','CL85',
  'GLF','GLEX','GL5T','GL7T','G280','G450','G500','G550','G650','G700',
  'LJ31','LJ35','LJ40','LJ45','LJ60','LJ70','LJ75','LJ85',
  'F900','FA10','FA20','FA50','FA7X','FA8X','F2TH','F8X',
  'E50P','E55P','E545','E550','EPIC',
  'HA4T','H25A','H25B','H25C','HDJT',
  'PRM1','BE40','BE4W','EA50','EA55',
];

const LIGHT = new Set([
  // Single-engine pistons
  'C150','C152','C162','C172','C175','C177','C180','C182','C185','C188','C195',
  'C206','C207','C208','C210','C310','C337','C340','C402','C404','C414','C421','C441',
  'PA18','PA22','PA23','PA24','PA28','PA30','PA31','PA32','PA34','PA38','PA42','PA44','PA46',
  'P28A','P28B','P28R','P28S','P28T','P32R',
  'BE19','BE20','BE23','BE24','BE33','BE35','BE36','BE55','BE58','BE76','BE77','BE9L','BE9T','BE10',
  'M20P','M20J','M20K','M20T','M5','M7','M20',
  'SR20','SR22','SR25','SR2T',
  'DA20','DA40','DA42','DA50','DA62',
  'TBM7','TBM8','TBM9','TBM','TB10','TB20','TB21',
  'PC6','PC7','PC12','PC21','PC24',
  'CC19','GA8','RV4','RV6','RV7','RV8','RV9','RV10','RV12','RV14',
]);

const HELI = new Set([
  // Robinson
  'R22','R44','R66',
  // Airbus Helicopters (Eurocopter)
  'AS32','AS35','AS50','AS5N','AS55','AS65','AS50C',
  'EC20','EC25','EC30','EC35','EC45','EC55','EC75','EC25M','EC35M','EC55B','EC55P','EC30B',
  'H125','H130','H135','H145','H155','H160','H160B','H175','H215','H225',
  // Bell
  'B06','B06T','B212','B214','B222','B230','B407','B412','B427','B429','B430','B505','B47','B47G','B206',
  // Sikorsky
  'S55','S58','S61','S64','S65','S70','S76','S76A','S76B','S76C','S76D','S92','S92A',
  // Leonardo / Agusta
  'A109','A119','A139','A149','A169','A189','A39','AW09','AW11','AW13','AW14','AW16','AW18','AW19',
  // MD Helicopters
  'MD60','MD50','MD52','MD53','MD60','EH10','EH101',
  // Mil
  'MI8','MI17','MI18','MI24','MI28','MI26','MI171','MI10',
  // Kawasaki / Kamov
  'K117','BK17','BK117','KA32','KA50','KA52',
]);

export function classifyAircraft(
  type: string | undefined | null,
  category: string | undefined | null,
): AircraftIconKind {
  const t = (type || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (category === 'A7' || HELI.has(t)) return 'heli';
  if (QUAD.has(t)) return 'quad';
  if (WIDEBODY.has(t)) return 'widebody';
  if (B737.has(t)) return 'b737';
  if (NARROW.has(t)) return 'narrow';
  if (REGIONAL.has(t)) return 'regional';
  if (REARJET.has(t)) return 'rearjet';
  if (TURBOPROP.has(t)) return 'turboprop';
  if (LIGHT.has(t)) return 'light';
  for (const p of BIZ_PREFIX) if (t.startsWith(p)) return 'biz';
  // Sin código reconocido: nos apoyamos en la categoría ADS-B.
  if (category === 'A5') return 'widebody';
  if (category === 'A1' || category === 'B1' || category === 'B4') return 'light';
  if (category === 'A2' || category === 'A6') return 'biz';
  return 'narrow';
}

// ─── Dibujo ──────────────────────────────────────────────────────────────────
// Lienzo de 64×64 con el origen en el centro; el morro apunta a -y.
interface Colors {
  fill: string;
  stroke: string;
  sw: number;
  halo: string;
}

function colorsFor(dark: boolean, selected: boolean): Colors {
  return {
    fill: selected ? '#FF9F0A' : dark ? '#0A84FF' : '#007AFF',
    stroke: dark ? '#000000' : '#ffffff',
    sw: 1.2,
    halo: selected
      ? '<circle cx="0" cy="0" r="28" fill="none" stroke="#FF9F0A" stroke-width="2" opacity="0.45"/>'
      : '',
  };
}

const f = (n: number) => Math.round(n * 100) / 100;

/** Fuselaje: morro redondeado y cola que se estrecha. h = media longitud, w = media anchura. */
function fuselage(h: number, w: number, tail = 0.18): string {
  return (
    `M0 ${f(-h)}` +
    `C${f(w * 0.55)} ${f(-h)} ${f(w)} ${f(-h + h * 0.22)} ${f(w)} ${f(-h + h * 0.42)}` +
    `L${f(w)} ${f(h * 0.45)}` +
    `C${f(w)} ${f(h * 0.7)} ${f(w * 0.4)} ${f(h * 0.9)} ${f(w * tail)} ${f(h)}` +
    `L${f(-w * tail)} ${f(h)}` +
    `C${f(-w * 0.4)} ${f(h * 0.9)} ${f(-w)} ${f(h * 0.7)} ${f(-w)} ${f(h * 0.45)}` +
    `L${f(-w)} ${f(-h + h * 0.42)}` +
    `C${f(-w)} ${f(-h + h * 0.22)} ${f(-w * 0.55)} ${f(-h)} 0 ${f(-h)}Z`
  );
}

interface Surface {
  /** Semienvergadura. */
  half: number;
  /** Y del borde de ataque en la raíz. */
  y: number;
  rootChord: number;
  tipChord: number;
  /** Retraso del borde de ataque en la punta respecto a la raíz (flecha). */
  sweep: number;
}

/** Superficie simétrica (ala o estabilizador) partiendo de la mitad del fuselaje. */
function surface(s: Surface, rootX: number): string {
  const { half, y, rootChord, tipChord, sweep } = s;
  const pts = [
    [rootX, y], [half, y + sweep], [half, y + sweep + tipChord], [rootX, y + rootChord],
    [-rootX, y + rootChord], [-half, y + sweep + tipChord], [-half, y + sweep], [-rootX, y],
  ];
  return `M${pts.map(([x, yy]) => `${f(x)} ${f(yy)}`).join('L')}Z`;
}

/** Gondola de motor: cápsula con el centro en (x, y). */
function nacelle(x: number, y: number, len: number, w: number): string {
  return `<rect x="${f(x - w / 2)}" y="${f(y)}" width="${f(w)}" height="${f(len)}" rx="${f(w / 2)}"/>`;
}

interface JetSpec {
  h: number;
  w: number;
  wing: Surface;
  tail: Surface;
  /** Motores bajo el ala: [x, y, largo, ancho] */
  engines?: [number, number, number, number][];
  /** Aletas de punta de ala (738/A320 sharklets). */
  tipFin?: boolean;
}

function renderJet(spec: JetSpec, c: Colors): string {
  const { h, w, wing, tail, engines = [], tipFin } = spec;
  const style = `fill="${c.fill}" stroke="${c.stroke}" stroke-width="${c.sw}" stroke-linejoin="round"`;
  let out = '';
  out += `<path d="${surface(wing, w * 0.8)}" ${style}/>`;
  out += `<path d="${surface(tail, w * 0.6)}" ${style}/>`;
  if (tipFin) {
    for (const sx of [1, -1]) {
      const x = sx * wing.half;
      const yl = wing.y + wing.sweep;
      out += `<path d="M${f(x)} ${f(yl)}L${f(x + sx * 1.6)} ${f(yl + 0.6)}L${f(x + sx * 1.6)} ${f(yl + wing.tipChord + 1.6)}L${f(x)} ${f(yl + wing.tipChord)}Z" ${style}/>`;
    }
  }
  for (const [x, y, len, ew] of engines) {
    out += `<g ${style}>${nacelle(x, y, len, ew)}${nacelle(-x, y, len, ew)}</g>`;
  }
  out += `<path d="${fuselage(h, w)}" ${style}/>`;
  return out;
}

function renderProp(c: Colors, opts: { h: number; w: number; wing: Surface; tail: Surface; engineX: number[]; engineY: number; engineLen: number; engineW: number }): string {
  const { h, w, wing, tail, engineX, engineY, engineLen, engineW } = opts;
  const style = `fill="${c.fill}" stroke="${c.stroke}" stroke-width="${c.sw}" stroke-linejoin="round"`;
  let out = `<path d="${surface(wing, w * 0.8)}" ${style}/>` + `<path d="${surface(tail, w * 0.6)}" ${style}/>`;
  for (const x of engineX) {
    out += `<g ${style}>${nacelle(x, engineY, engineLen, engineW)}${nacelle(-x, engineY, engineLen, engineW)}</g>`;
    for (const sx of [x, -x]) {
      out += `<line x1="${f(sx - 4.4)}" y1="${f(engineY - 0.8)}" x2="${f(sx + 4.4)}" y2="${f(engineY - 0.8)}" stroke="${c.fill}" stroke-width="1.3" stroke-linecap="round" opacity="0.85"/>`;
    }
  }
  out += `<path d="${fuselage(h, w, 0.12)}" ${style}/>`;
  return out;
}

const SPECS: Record<Exclude<AircraftIconKind, 'turboprop' | 'light' | 'heli' | 'rearjet' | 'biz'>, JetSpec> = {
  narrow: {
    h: 24, w: 2.4,
    wing: { half: 18, y: -3, rootChord: 10.5, tipChord: 2.6, sweep: 9.5 },
    tail: { half: 7.2, y: 16, rootChord: 5.4, tipChord: 2, sweep: 3.2 },
    engines: [[6.4, -5, 6.6, 2.8]],
    tipFin: true,
  },
  b737: {
    h: 23, w: 2.3,
    wing: { half: 17.5, y: -2, rootChord: 9.6, tipChord: 2.4, sweep: 9 },
    tail: { half: 7, y: 15.4, rootChord: 5, tipChord: 2, sweep: 3 },
    engines: [[5.6, -3.4, 6, 3.1]],
    tipFin: true,
  },
  regional: {
    h: 19.5, w: 2.1,
    wing: { half: 13.5, y: -2, rootChord: 8, tipChord: 2.2, sweep: 6.6 },
    tail: { half: 5.8, y: 13, rootChord: 4.2, tipChord: 1.8, sweep: 2.6 },
    engines: [[5, -3.6, 5.2, 2.5]],
  },
  widebody: {
    h: 28, w: 2.9,
    wing: { half: 28, y: -5, rootChord: 15, tipChord: 3.4, sweep: 15 },
    tail: { half: 11, y: 19.5, rootChord: 7.4, tipChord: 2.8, sweep: 5.2 },
    engines: [[11, -6, 9.4, 3.8]],
  },
  quad: {
    h: 30, w: 3.1,
    wing: { half: 30, y: -6, rootChord: 16, tipChord: 3.4, sweep: 17 },
    tail: { half: 12, y: 21, rootChord: 7.8, tipChord: 3, sweep: 5.6 },
    engines: [[9.4, -7.6, 9, 3.4], [19, -2.4, 9, 3.4]],
  },
};

function renderRearJet(c: Colors, big: boolean): string {
  const h = big ? 20 : 15;
  const w = big ? 2.1 : 1.7;
  const wing: Surface = big
    ? { half: 13, y: -1, rootChord: 7.4, tipChord: 2.1, sweep: 6 }
    : { half: 9.8, y: -0.5, rootChord: 6, tipChord: 1.9, sweep: 6.2 };
  const tail: Surface = big
    ? { half: 6, y: h - 7.4, rootChord: 3.8, tipChord: 1.7, sweep: 2.2 }
    : { half: 4.6, y: h - 5.4, rootChord: 3.2, tipChord: 1.5, sweep: 2.4 };
  const ex = w + 2.4;
  return renderJet(
    { h, w, wing, tail, engines: [[ex, h * 0.18, big ? 6.2 : 5, 2.5]] },
    c,
  );
}

function planeHeli(c: Colors): string {
  const style = `fill="${c.fill}" stroke="${c.stroke}" stroke-width="${c.sw}" stroke-linejoin="round"`;
  return (
    // Disco y palas del rotor principal
    `<circle cx="0" cy="-2" r="19" fill="${c.fill}" opacity="0.07"/>` +
    `<line x1="-20" y1="-2" x2="20" y2="-2" stroke="${c.stroke}" stroke-width="3.2" stroke-linecap="round" opacity="0.8"/>` +
    `<line x1="-20" y1="-2" x2="20" y2="-2" stroke="${c.fill}" stroke-width="1.6" stroke-linecap="round"/>` +
    `<line x1="0" y1="-22" x2="0" y2="18" stroke="${c.stroke}" stroke-width="3.2" stroke-linecap="round" opacity="0.8"/>` +
    `<line x1="0" y1="-22" x2="0" y2="18" stroke="${c.fill}" stroke-width="1.6" stroke-linecap="round"/>` +
    // Botalón de cola y rotor de cola
    `<rect x="-1.3" y="4" width="2.6" height="19" rx="1.2" ${style}/>` +
    `<line x1="-4" y1="22.5" x2="4" y2="22.5" stroke="${c.fill}" stroke-width="1.4" stroke-linecap="round"/>` +
    // Cabina
    `<ellipse cx="0" cy="-2" rx="5.6" ry="9" ${style}/>` +
    `<circle cx="0" cy="-2" r="1.8" fill="${c.stroke}"/>`
  );
}

function renderLight(c: Colors): string {
  const style = `fill="${c.fill}" stroke="${c.stroke}" stroke-width="${c.sw}" stroke-linejoin="round"`;
  const wing: Surface = { half: 12.5, y: -3.4, rootChord: 4.6, tipChord: 3.6, sweep: 0.6 };
  const tail: Surface = { half: 4.8, y: 7.4, rootChord: 2.8, tipChord: 2, sweep: 0.6 };
  return (
    `<path d="${surface(wing, 1.6)}" ${style}/>` +
    `<path d="${surface(tail, 1.2)}" ${style}/>` +
    `<path d="${fuselage(11, 1.9, 0.14)}" ${style}/>` +
    `<line x1="-4.4" y1="-11.6" x2="4.4" y2="-11.6" stroke="${c.fill}" stroke-width="1.3" stroke-linecap="round" opacity="0.85"/>`
  );
}

function bodySvg(kind: AircraftIconKind, c: Colors): string {
  switch (kind) {
    case 'heli':
      return planeHeli(c);
    case 'light':
      return renderLight(c);
    case 'rearjet':
      return renderRearJet(c, true);
    case 'biz':
      return renderRearJet(c, false);
    case 'turboprop':
      return renderProp(c, {
        h: 18, w: 2.1,
        wing: { half: 19, y: -4.5, rootChord: 7.4, tipChord: 4.6, sweep: 1.6 },
        tail: { half: 6.8, y: 11.6, rootChord: 4.2, tipChord: 2.6, sweep: 1.2 },
        engineX: [7.4], engineY: -8.6, engineLen: 12, engineW: 2.8,
      });
    default:
      return renderJet(SPECS[kind], c);
  }
}

// Los aparatos pequeños se amplían un poco para que sigan siendo legibles en el mapa.
const KIND_SCALE: Partial<Record<AircraftIconKind, number>> = {
  regional: 1.25,
  rearjet: 1.35,
  biz: 1.6,
  light: 1.5,
  turboprop: 1.15,
  narrow: 1.1,
  b737: 1.1,
};

export function planeSvgForKind(kind: AircraftIconKind, dark: boolean, selected = false): string {
  const c = colorsFor(dark, selected);
  const k = KIND_SCALE[kind] ?? 1;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <g transform="translate(32 32)">${c.halo}<g transform="scale(${k})">${bodySvg(kind, c)}</g></g>
  </svg>`;
}
