import { useState, type ReactNode } from 'react';
import { ChevronDownIcon } from './icons';

interface Props {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

/** Sección plegable para el panel de detalle. */
export function Accordion({ title, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-black/5 dark:border-white/10">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-3 text-left"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-gray-500 dark:text-[#8E8E93]">
          {title}
        </span>
        <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}
