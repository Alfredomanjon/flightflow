import type { ReactNode } from 'react';

interface Props {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

/** Chip de filtro (pill). Activo = azul primario como la navegación de Analytics. */
export function Chip({ active = false, onClick, children }: Props) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? 'border-[#007AFF]/30 bg-[#007AFF]/10 text-[#007AFF] dark:border-[#0A84FF]/40 dark:bg-[#0A84FF]/15 dark:text-[#0A84FF]'
          : 'border-black/10 text-gray-500 hover:bg-black/5 hover:text-gray-900 dark:border-white/10 dark:text-[#8E8E93] dark:hover:bg-white/8 dark:hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}
