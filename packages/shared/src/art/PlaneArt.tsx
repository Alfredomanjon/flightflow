import { artFor, ART_KEYS, type ArtKey } from './typeMap';

interface ArtData {
  w: number;
  h: number;
  inner: string;
}

const RAW = import.meta.glob('./aircraft/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** Turns the drawings' fixed colours into currentColor so they follow the theme. */
function recolor(svg: string): string {
  return svg
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/fill="#1c1c1c"/g, 'fill="currentColor"')
    .replace(/stroke="#1c1c1c"/g, 'stroke="currentColor"')
    .replace(/fill="#5a5a5a"/g, 'fill="currentColor" fill-opacity="0.7"')
    .replace(/fill="#8a8a8a"/g, 'fill="currentColor" fill-opacity="0.45"')
    .replace(/stroke="#9a9a9a"/g, 'stroke="currentColor" stroke-opacity="0.4"')
    // Each stroke keeps its own width (1.1 outline, 0.6–0.7 details) times the
    // style's --stroke-k, so fine details don't merge.
    .replace(/stroke-width="([\d.]+)"/g, 'style="stroke-width:calc($1px * var(--stroke-k, 1))"');
}

function parse(raw: string): ArtData {
  const vb = /viewBox="([\d.\s-]+)"/.exec(raw)?.[1].trim().split(/\s+/).map(Number) ?? [0, 0, 400, 130];
  const start = raw.indexOf('>', raw.indexOf('<svg')) + 1;
  const end = raw.lastIndexOf('</svg>');
  return { w: vb[2], h: vb[3], inner: recolor(raw.slice(start, end)) };
}

export const ART: Record<ArtKey, ArtData> = Object.fromEntries(
  ART_KEYS.map((k) => {
    const entry = Object.entries(RAW).find(([path]) => path.endsWith(`/${k}.svg`));
    if (!entry) throw new Error(`Missing drawing ${k}.svg`);
    return [k, parse(entry[1])];
  }),
) as Record<ArtKey, ArtData>;

/** Common canvas: every visible drawing shares one scale (10 px = 1 m). */
export function sharedCanvas(keys: ArtKey[]): { w: number; h: number } {
  if (keys.length === 0) return { w: 400, h: 130 };
  return {
    w: Math.max(...keys.map((k) => ART[k].w)),
    h: Math.max(...keys.map((k) => ART[k].h)),
  };
}

interface Props {
  art: ArtKey;
  canvas: { w: number; h: number };
  /** Drawings face left; flip them for planes flying east. */
  flip?: boolean;
  label: string;
}

export function PlaneArt({ art, canvas, flip, label }: Props) {
  const a = ART[art];
  const x = (canvas.w - a.w) / 2;
  const y = canvas.h - a.h;
  return (
    <svg
      viewBox={`0 0 ${canvas.w} ${canvas.h}`}
      preserveAspectRatio="xMidYMax meet"
      className="plane-art block h-full w-full"
      role="img"
      aria-label={label}
    >
      <g transform={flip ? `translate(${canvas.w} 0) scale(-1 1)` : undefined}>
        <svg
          x={x}
          y={y}
          width={a.w}
          height={a.h}
          viewBox={`0 0 ${a.w} ${a.h}`}
          overflow="visible"
          dangerouslySetInnerHTML={{ __html: a.inner }}
        />
      </g>
    </svg>
  );
}

/** A single side profile at its own size, for lists and widgets (e.g. Analytics' top models). */
export function AircraftArt({
  type,
  category,
  className,
  title,
}: {
  type?: string | null;
  category?: string | null;
  className?: string;
  title?: string;
}) {
  const a = ART[artFor(type, category).art];
  return (
    <svg
      viewBox={`0 0 ${a.w} ${a.h}`}
      className={className}
      role="img"
      aria-label={title ?? type ?? ''}
      overflow="visible"
      dangerouslySetInnerHTML={{ __html: a.inner }}
    />
  );
}
