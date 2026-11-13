import { t } from '@flightflow/shared';
import { ExpandIcon, GearIcon, MoonIcon, ShrinkIcon, SunIcon } from './ui/icons';

interface Props {
  visible: boolean;
  dark: boolean;
  fullscreen: boolean;
  onSettings: () => void;
  onFullscreen: () => void;
  onDark: () => void;
}

const btn =
  'flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white';

export function Controls({ visible, dark, fullscreen, onSettings, onFullscreen, onDark }: Props) {
  return (
    <div
      className={`glass-strong fixed right-3 top-3 z-40 flex items-center gap-0.5 rounded-xl border border-black/5 p-1 shadow-sm transition-opacity duration-300 dark:border-white/10 ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <button type="button" className={btn} onClick={onDark} aria-label={t('common.toggleDark')}>
        {dark ? <SunIcon /> : <MoonIcon />}
      </button>
      <button type="button" className={btn} onClick={onFullscreen} aria-label={t('portrait.fullscreen')}>
        {fullscreen ? <ShrinkIcon /> : <ExpandIcon />}
      </button>
      <div className="mx-0.5 h-5 w-px bg-gray-200 dark:bg-white/10" />
      <button type="button" className={btn} onClick={onSettings} aria-label={t('portrait.settings')}>
        <GearIcon />
      </button>
    </div>
  );
}
