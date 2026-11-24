import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Obligatorio: los botones de icono no tienen texto visible. */
  label: string;
  active?: boolean;
  children: ReactNode;
}

/** Botón cuadrado de 40 px (objetivo táctil mínimo) para barras y cabeceras. */
export function IconButton({ label, active = false, className = '', children, ...rest }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active || undefined}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
        active
          ? 'bg-[#007AFF]/10 text-[#007AFF] dark:bg-[#0A84FF]/15 dark:text-[#0A84FF]'
          : 'text-gray-500 hover:bg-black/5 hover:text-gray-900 dark:text-[#8E8E93] dark:hover:bg-white/8 dark:hover:text-white'
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
