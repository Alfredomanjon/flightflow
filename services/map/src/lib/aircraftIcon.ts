// Clasificación de aviones en 5 familias visuales y generación de SVGs.

export type AircraftIconKind = 'heavy' | 'narrow' | 'regional' | 'biz' | 'heli';

export const ICON_KINDS: AircraftIconKind[] = ['heavy', 'narrow', 'regional', 'biz', 'heli'];

const HEAVY = new Set([
  // Widebody Airbus
  'A332','A333','A338','A339','A342','A343','A345','A346','A359','A35K',
  'A380','A388','A30B','A306','A310','A30F','A300','A30W',
  // Widebody Boeing
  'B742','B743','B744','B748','B74F','B74D','B74R',
  'B762','B763','B764','B77F',
  'B772','B773','B77L','B77W','B778','B779',
  'B783','B788','B789','B78X','B787',
  // Otros widebody
  'IL96','MD11','DC10','L101',
]);

const NARROW = new Set([
  // Airbus narrow-body
  'A318','A319','A320','A321','A19N','A20N','A21N',
  'A220','A221','A223','BCS1','BCS3',
  // Boeing narrow-body
  'B731','B732','B733','B734','B735','B736','B737','B738','B739',
  'B73G','B73H','B73J','B73K','B73L','B73M','B73N',
  'B752','B753','B757',
  // Embraer E-Jets
  'E170','E175','E190','E195','E290','E295',
  // CRJ regional largos
  'CRJ7','CRJ9','CRJX','CRJ10',
  // MDxx
  'MD80','MD81','MD82','MD83','MD87','MD88','MD90','MD95',
  // Sukhoi
  'SU95','SSJ','SSJ100',
]);

const REGIONAL = new Set([
  // Turboprops
  'AT42','AT43','AT44','AT45','AT46','AT72','AT73','AT75','AT76',
  'DH8A','DH8B','DH8C','DH8D','DHC8','DH4','DH3','DHC6',
  'SF34','SF50','SB20','SB05','J31','J32','J41',
  'BE99','BE19','D228','D328','D38','F27','F50','F60','F70','F100',
  'AT2','AT3','AT4','AT5','AT7',
  // Regional jets
  'CRJ1','CRJ2','CRJ200',
  'E110','E120','E135','E140','E145','E45X','EM2',
]);

// Business jets — comprobamos por prefijo además de set exacto
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
  'MD60','MD90','MD50','MD52','MD53','MD60','EH10','EH101',
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
  if (category === 'A5' || HEAVY.has(t)) return 'heavy';
  if (REGIONAL.has(t)) return 'regional';
  if (NARROW.has(t)) return 'narrow';
  if (LIGHT.has(t)) return 'biz';
  for (const p of BIZ_PREFIX) if (t.startsWith(p)) return 'biz';
  if (category === 'A1' || category === 'A2') return 'biz';
  // Fallback comercial genérico
  return 'narrow';
}

// ─── SVG por familia ─────────────────────────────────────────────────────────
interface SvgColors {
  fill: string;
  stroke: string;
  sw: number;
  halo: string;
}

function paletteFor(dark: boolean): SvgColors {
  return {
    fill: dark ? '#ffffff' : '#123b89',
    stroke: dark ? '#0b1226' : '#ffffff',
    sw: dark ? 1.6 : 1.4,
    halo: dark
      ? `<defs><radialGradient id="h" cx="0" cy="0" r="22" gradientUnits="userSpaceOnUse">
           <stop offset="0%" stop-color="#9ab8ff" stop-opacity="0.45"/>
           <stop offset="60%" stop-color="#9ab8ff" stop-opacity="0.10"/>
           <stop offset="100%" stop-color="#9ab8ff" stop-opacity="0"/>
         </radialGradient></defs>
         <circle cx="0" cy="0" r="22" fill="url(#h)" />`
      : '',
  };
}

function wrap(inner: string, dark: boolean): string {
  const { halo } = paletteFor(dark);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <g transform="translate(32 32)">${halo}${inner}</g>
  </svg>`;
}

function planeNarrow(dark: boolean): string {
  const { fill, stroke, sw } = paletteFor(dark);
  return wrap(
    `<path d="M0 -24 L4 -4 L26 6 L26 11 L4 6 L4 18 L10 22 L10 26 L0 24 L-10 26 L-10 22 L-4 18 L-4 6 L-26 11 L-26 6 L-4 -4 Z"
       fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`,
    dark,
  );
}

function planeHeavy(dark: boolean): string {
  const { fill, stroke, sw } = paletteFor(dark);
  return wrap(
    `<path d="M0 -28 L3 -6 L32 4 L32 9 L3 4 L3 20 L10 24 L10 28 L0 26 L-10 28 L-10 24 L-3 20 L-3 4 L-32 9 L-32 4 L-3 -6 Z"
       fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>
     <circle cx="-22" cy="6" r="2.4" fill="${fill}" stroke="${stroke}" stroke-width="${sw * 0.7}"/>
     <circle cx="-11" cy="3" r="2.4" fill="${fill}" stroke="${stroke}" stroke-width="${sw * 0.7}"/>
     <circle cx="11" cy="3" r="2.4" fill="${fill}" stroke="${stroke}" stroke-width="${sw * 0.7}"/>
     <circle cx="22" cy="6" r="2.4" fill="${fill}" stroke="${stroke}" stroke-width="${sw * 0.7}"/>`,
    dark,
  );
}

function planeRegional(dark: boolean): string {
  const { fill, stroke, sw } = paletteFor(dark);
  // Hélices visibles en los extremos de las alas
  return wrap(
    `<path d="M0 -20 L4 -2 L22 6 L22 10 L4 6 L4 15 L9 18 L9 22 L0 20 L-9 22 L-9 18 L-4 15 L-4 6 L-22 10 L-22 6 L-4 -2 Z"
       fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>
     <circle cx="-17" cy="4" r="3.4" fill="none" stroke="${stroke}" stroke-width="${sw * 1.1}"/>
     <circle cx="17"  cy="4" r="3.4" fill="none" stroke="${stroke}" stroke-width="${sw * 1.1}"/>`,
    dark,
  );
}

function planeBiz(dark: boolean): string {
  const { fill, stroke, sw } = paletteFor(dark);
  // Más pequeño, alas en flecha, T-tail
  return wrap(
    `<path d="M0 -18 L3 -2 L20 10 L20 13 L3 7 L3 12 L7 16 L7 19 L0 17 L-7 19 L-7 16 L-3 12 L-3 7 L-20 13 L-20 10 L-3 -2 Z"
       fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`,
    dark,
  );
}

function planeHeli(dark: boolean): string {
  const { fill, stroke, sw } = paletteFor(dark);
  // Cuerpo oval + cola hacia atrás + rotor como X
  return wrap(
    `<line x1="-22" y1="-2" x2="22" y2="-2" stroke="${stroke}" stroke-width="${sw * 1.3}" stroke-linecap="round" opacity="0.7"/>
     <line x1="-2"  y1="-22" x2="-2" y2="20" stroke="${stroke}" stroke-width="${sw * 1.3}" stroke-linecap="round" opacity="0.7"/>
     <rect x="-1.5" y="2" width="3" height="20" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
     <ellipse cx="0" cy="-2" rx="7" ry="10" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
     <circle cx="0" cy="-2" r="2" fill="${stroke}"/>`,
    dark,
  );
}

export function planeSvgForKind(kind: AircraftIconKind, dark: boolean): string {
  switch (kind) {
    case 'heavy': return planeHeavy(dark);
    case 'narrow': return planeNarrow(dark);
    case 'regional': return planeRegional(dark);
    case 'biz': return planeBiz(dark);
    case 'heli': return planeHeli(dark);
  }
}
