import { cleanCallsign, t, type Aircraft } from '@flightflow/shared';

interface Props {
  aircraft: Aircraft[];
  selectedHex: string | null;
  onSelect: (hex: string | null) => void;
}

export function TrafficList({ aircraft, selectedHex, onSelect }: Props) {
  const sorted = [...aircraft].sort((a, b) => {
    const fa = cleanCallsign(a.flight);
    const fb = cleanCallsign(b.flight);
    if (fa && !fb) return -1;
    if (!fa && fb) return 1;
    return fa.localeCompare(fb);
  });

  return (
    <div className="flex flex-col gap-[7px] pr-1">
      {sorted.map((a) => {
        const callsign = cleanCallsign(a.flight) || a.hex.toUpperCase();
        const reg = a.r ?? '';
        const type = a.t ?? a.category ?? '';
        const selected = selectedHex === a.hex;
        return (
          <button
            key={a.hex}
            type="button"
            onClick={() => onSelect(selected ? null : a.hex)}
            className={`glass-item relative flex h-[37px] w-full items-center rounded-[10px] px-[14px] text-left ${
              selected ? 'glass-item--selected' : ''
            }`}
          >
            <span className="text-[17px] font-bold text-ink-accent dark:text-[#0A84FF]">{callsign}</span>
            <span className="ml-auto flex items-center gap-[10px] text-[12px] text-black dark:text-slate-400">
              <span>{reg || '—'}</span>
              <span className="inline-block h-[3px] w-[3px] rounded-full bg-black/60" />
              <span>{type || '—'}</span>
            </span>
          </button>
        );
      })}
      {sorted.length === 0 && (
        <p className="px-2 py-4 text-center text-[13px] text-ink-muted">{t('map.waiting')}</p>
      )}
    </div>
  );
}
