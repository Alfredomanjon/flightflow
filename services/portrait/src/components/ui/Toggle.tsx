interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}

/** Interruptor estilo iOS. */
export function Toggle({ checked, onChange, label }: Props) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-2">
      <span className="text-sm text-gray-900 dark:text-white">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors ${
          checked ? 'bg-[#34C759]' : 'bg-gray-300 dark:bg-white/15'
        }`}
      >
        <span
          className={`absolute left-0 top-[2px] h-[22px] w-[22px] rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-[20px]' : 'translate-x-[2px]'
          }`}
        />
      </button>
    </label>
  );
}
