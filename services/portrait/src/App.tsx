import { useCallback, useState } from 'react';
import {
  artFor,
  config,
  formatTime,
  sharedCanvas,
  useAircraft,
  useAircraftDb,
  useClock,
  useDarkMode,
} from '@flightflow/shared';
import { CONTROLS_HIDE_MS, ONLINE_TIMEOUT_MS, placeLabel, REFRESH_MS } from './config';
import { useActivity, useFullscreen, useMediaQuery, useWakeLock } from './hooks/useKiosk';
import { useNearest } from './hooks/useNearest';
import { usePhase } from './hooks/usePhase';
import { useSettings } from './hooks/useSettings';

import { Controls } from './components/Controls';
import { EmptySky } from './components/EmptySky';
import { PlaneCard } from './components/PlaneCard';

import { Settings } from './components/Settings';

/**
 * Posición de cada avión en modo pirámide.
 * - Horizontal (rejilla de 4): dos arriba y el tercero abajo, centrado.
 * - Vertical (rejilla de 3, una fila por avión): escalonado izquierda → derecha → izquierda.
 */
const PYRAMID_SLOTS = [
  'col-span-2 landscape:row-start-1 portrait:col-start-1 portrait:row-start-1',
  'col-span-2 landscape:row-start-1 portrait:col-start-2 portrait:row-start-2',
  'col-span-2 landscape:col-start-2 landscape:row-start-2 portrait:col-start-1 portrait:row-start-3',
];

export default function App() {
  const { settings, set } = useSettings();
  const mock = config().receiver.mock;
  const feed = useAircraft(REFRESH_MS, ONLINE_TIMEOUT_MS);
  const { planes, nearestOutside, inRange } = useNearest(feed.aircraft, settings.radiusKm, settings.maxPlanes);
  const phases = usePhase(planes);
  const db = useAircraftDb(mock ? [] : planes.map((p) => p.ac.hex), 'ff:portrait:hexdb-v1');
  const now = useClock();
  const [dark, toggleDark] = useDarkMode('ff:dark-mode', true);
  const [fullscreen, toggleFullscreen] = useFullscreen();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const active = useActivity(CONTROLS_HIDE_MS);
  const landscape = useMediaQuery('(orientation: landscape)');
  useWakeLock();

  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const showControls = active || settingsOpen;

  const canvas = sharedCanvas(planes.map((p) => artFor(p.ac.t || db[p.ac.hex]?.icaoType, p.ac.category).art));
  const n = planes.length;
  // Pirámide invertida: sólo tiene sentido con 3 aviones (2 arriba, 1 abajo centrado).
  const pyramid = settings.layout === 'pyramid' && n === 3;
  // En vertical la pirámide es escalonada y cada tarjeta ocupa 2/3 del ancho: texto normal.
  const textScale = n === 1 ? 1.35 : n === 2 || (pyramid && landscape) ? 1.1 : 1;
  const time = formatTime(now);
  const place = placeLabel();

  return (
    <div
      className={`portrait portrait-frame h-full w-full p-[clamp(6px,1.4vmin,20px)] ${showControls ? '' : 'cursor-hidden'}`}
      data-style={settings.style}
      data-ink={settings.ink}
    >
      <div className="portrait-mat h-full w-full p-[clamp(12px,4.5vmin,72px)]">
        <main className="portrait-paper flex h-full w-full flex-col px-[3vmin] pb-[3.5vmin] pt-[2.2vmin]">
          <header
            className="flex shrink-0 items-center justify-between uppercase tracking-[0.2em] opacity-60"
            style={{ fontSize: 'calc(10.5 * var(--u))' }}
          >
            <span>FlightFlow · Portrait</span>
            <span className="tabular-nums">
              {time}
              {place ? ` · ${place}` : ''}
            </span>
          </header>

          {n === 0 ? (
            <EmptySky radiusKm={settings.radiusKm} nearest={nearestOutside} online={feed.online} />
          ) : (
            <div
              className={`mt-[2vmin] grid min-h-0 flex-1 gap-[4vmin] ${
                pyramid
                  ? // Horizontal: 2 arriba + 1 abajo. Vertical (pantallas estrechas): escalonado.
                    'landscape:grid-cols-4 portrait:grid-cols-3'
                  : `portrait:grid-cols-1 ${
                      n === 1 ? 'landscape:grid-cols-1' : n === 2 ? 'landscape:grid-cols-2' : 'landscape:grid-cols-3'
                    }`
              }`}
              style={{ gridAutoRows: 'minmax(0, 1fr)' }}
            >
              {planes.map((p, i) => (
                <div
                  key={p.ac.hex}
                  className={`flex min-h-0 min-w-0 ${pyramid ? PYRAMID_SLOTS[i] : ''}`}
                >
                  <PlaneCard
                    plane={p}
                    info={db[p.ac.hex]}
                    canvas={canvas}
                    show={settings.show}
                    phase={phases.get(p.ac.hex)}
                    phaseDisplay={settings.phase}
                    scale={textScale}
                  />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <Controls
        visible={showControls}
        dark={dark}
        fullscreen={fullscreen}
        onDark={toggleDark}
        onFullscreen={toggleFullscreen}
        onSettings={() => setSettingsOpen(true)}
      />
      <Settings
        open={settingsOpen}
        onClose={closeSettings}
        settings={settings}
        set={set}
        status={{ online: feed.online, lastUpdate: feed.lastUpdate, inRange, mock }}
      />
    </div>
  );
}
