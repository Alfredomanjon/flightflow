import { useEffect, useState, type ReactNode } from 'react';
import { distance, distanceUnit, formatDistance, t, tn, toKm } from '@flightflow/shared';
import { MAX_RADIUS_KM, MIN_RADIUS_KM, placeLabel } from '../config';
import { clampRadius, type FrameStyle, type Ink, type Layout, type Settings as S } from '../hooks/useSettings';
import { CloseIcon } from './ui/icons';
import { Segmented } from './ui/Segmented';
import { StatusBadge } from './ui/StatusBadge';
import { Toggle } from './ui/Toggle';

interface Props {
  open: boolean;
  onClose: () => void;
  settings: S;
  set: (patch: Partial<S>) => void;
  status: { online: boolean; lastUpdate: number | null; inRange: number; mock: boolean };
}

const INKS: { value: Ink; color: string }[] = [
  { value: 'red', color: '#c8372d' },
  { value: 'blue', color: '#1f4e9c' },
  { value: 'black', color: '#1c1c1c' },
];

/** Radius shown in the user's distance unit (km or mi), stored in km. */
const shownRadius = (km: number) => String(Math.round(distance(km).value));

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="glass flex flex-col gap-3 rounded-2xl p-4">
      <h3 className="label-caps">{title}</h3>
      {children}
    </section>
  );
}

function ago(ts: number | null): string {
  if (ts == null) return t('portrait.never');
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  return s < 60 ? t('portrait.agoS', { n: s }) : t('portrait.agoMin', { n: Math.floor(s / 60) });
}

export function Settings({ open, onClose, settings, set, status }: Props) {
  const [radius, setRadius] = useState(shownRadius(settings.radiusKm));
  const [, tick] = useState(0);
  useEffect(() => setRadius(shownRadius(settings.radiusKm)), [settings.radiusKm]);
  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => tick((t) => t + 1), 1000);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const commitRadius = () => {
    const n = Number(radius);
    if (Number.isFinite(n) && n > 0) set({ radiusKm: clampRadius(toKm(n)) });
    else setRadius(shownRadius(settings.radiusKm));
  };

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t('portrait.settings')}
        className={`glass-solid absolute flex flex-col font-sans text-gray-900 shadow-2xl transition-transform duration-300 ease-out dark:text-white
          inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl
          md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[380px] md:rounded-none md:border-l md:border-black/5 md:dark:border-white/10
          ${open ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-x-full md:translate-y-0'}`}
      >
        <header className="glass-strong flex h-14 shrink-0 items-center gap-2 border-b border-black/5 px-4 dark:border-white/8 max-md:rounded-t-2xl">
          <svg className="h-5 w-5 text-[#007AFF]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2h-1A1.5 1.5 0 0 0 9 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L12 19v-5.5L21 16Z" />
          </svg>
          <span className="text-sm font-semibold">{t('portrait.settings')}</span>
          <span className="text-xs text-gray-400">Portrait</span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('portrait.closeSettings')}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="flex flex-col gap-3 overflow-y-auto p-4 pb-8">
          <Section title={t('portrait.style')}>
            <Segmented<FrameStyle>
              label={t('portrait.frameStyle')}
              value={settings.style}
              onChange={(style) => set({ style })}
              options={[
                { value: 'lamina', label: t('portrait.style.lamina') },
                { value: 'plano', label: t('portrait.style.plano') },
                { value: 'noche', label: t('portrait.style.noche') },
              ]}
            />
            {settings.style === 'lamina' && (
              <div className="flex items-center gap-3 pt-1" role="radiogroup" aria-label={t('portrait.ink')}>
                <span className="text-sm text-gray-500 dark:text-[#8E8E93]">{t('portrait.ink')}</span>
                <div className="ml-auto flex gap-3">
                  {INKS.map((i) => (
                    <button
                      key={i.value}
                      type="button"
                      role="radio"
                      aria-checked={settings.ink === i.value}
                      aria-label={t(`portrait.ink.${i.value}`)}
                      title={t(`portrait.ink.${i.value}`)}
                      onClick={() => set({ ink: i.value })}
                      className={`h-6 w-6 rounded-full ring-offset-2 ring-offset-white transition dark:ring-offset-[#1C1C1E] ${
                        settings.ink === i.value ? 'ring-2 ring-[#007AFF]' : 'ring-1 ring-black/10 dark:ring-white/20'
                      }`}
                      style={{ background: i.color }}
                    />
                  ))}
                </div>
              </div>
            )}
          </Section>

          <Section title={t('portrait.planes')}>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-gray-500 dark:text-[#8E8E93]">{t('portrait.maxInFrame')}</span>
              <Segmented<number>
                label={t('portrait.maxPlanes')}
                value={settings.maxPlanes}
                onChange={(n) => set({ maxPlanes: n as 1 | 2 | 3 })}
                options={[1, 2, 3].map((n) => ({ value: n, label: String(n) }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-gray-500 dark:text-[#8E8E93]">{t('portrait.layout')}</span>
              <Segmented<Layout>
                label={t('portrait.layoutAria')}
                value={settings.layout}
                onChange={(layout) => set({ layout })}
                options={[
                  { value: 'row', label: t('portrait.layout.row') },
                  { value: 'pyramid', label: t('portrait.layout.pyramid') },
                ]}
              />
              <span className="text-xs text-gray-400 dark:text-[#636366]">
                {settings.maxPlanes === 3
                  ? t('portrait.pyramidHint3')
                  : t('portrait.pyramidHint')}
              </span>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-gray-500 dark:text-[#8E8E93]">{t('portrait.radius')}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={Math.round(distance(MIN_RADIUS_KM).value)}
                  max={Math.round(distance(MAX_RADIUS_KM).value)}
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  onBlur={commitRadius}
                  onKeyDown={(e) => e.key === 'Enter' && commitRadius()}
                  className="input w-24 tabular-nums"
                />
                <span className="text-sm text-gray-500 dark:text-[#8E8E93]">{distanceUnit()}</span>
              </div>
              <span className="text-xs text-gray-400 dark:text-[#636366]">
                {t('portrait.radiusHint', {
                  place: placeLabel() || t('portrait.theReceiver'),
                  min: Math.round(distance(MIN_RADIUS_KM).value),
                  max: Math.round(distance(MAX_RADIUS_KM).value),
                  unit: distanceUnit(),
                })}
              </span>
            </label>
          </Section>

          <Section title={t('portrait.show')}>
            <div className="divide-y divide-black/5 dark:divide-white/8">
              <Toggle label={t('portrait.show.logo')} checked={settings.show.logo} onChange={(logo) => set({ show: { ...settings.show, logo } })} />
              <Toggle label={t('portrait.show.reg')} checked={settings.show.reg} onChange={(reg) => set({ show: { ...settings.show, reg } })} />
              <Toggle label={t('portrait.show.dist')} checked={settings.show.dist} onChange={(dist) => set({ show: { ...settings.show, dist } })} />
              <Toggle label={t('portrait.show.speed')} checked={settings.show.speed} onChange={(speed) => set({ show: { ...settings.show, speed } })} />
            </div>
          </Section>

          <Section title={t('portrait.status')}>
            <div className="flex items-center justify-between">
              <StatusBadge ok={status.online} okLabel={status.mock ? t('portrait.demo') : t('portrait.receiving')} />
              <span className="text-xs text-gray-400 dark:text-[#636366]">{t('portrait.updated', { ago: ago(status.lastUpdate) })}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[32px] font-semibold leading-none tracking-tight tabular-nums">{status.inRange}</span>
              <span className="text-sm font-medium text-gray-500 dark:text-[#8E8E93]">
                {tn('portrait.inRange', status.inRange, { r: formatDistance(settings.radiusKm, 0) })}
              </span>
            </div>
          </Section>
        </div>
      </aside>
    </div>
  );
}
