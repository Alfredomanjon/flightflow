interface Option<T> {
  value: T;
  label: string;
}

interface Props<T> {
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  label: string;
  size?: 'sm' | 'md';
}

/** Control segmentado con el mismo estilo que la navegación de Analytics. */
export function Segmented<T extends string | number>({ value, options, onChange, label, size = 'md' }: Props<T>) {
  const pad = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-xl bg-black/5 p-1 dark:bg-white/[0.07]">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`flex-1 rounded-lg transition-colors ${pad} ${
              active
                ? 'bg-white font-medium text-[#007AFF] shadow-sm dark:bg-[#007AFF]/15 dark:text-[#0A84FF] dark:shadow-none'
                : 'text-gray-500 hover:bg-black/5 hover:text-gray-900 dark:text-[#8E8E93] dark:hover:bg-white/8 dark:hover:text-white'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
