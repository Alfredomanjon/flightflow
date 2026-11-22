import { useEffect, useRef, useState } from 'react';
import type { Map as MlMap } from 'maplibre-gl';
import { t } from '@flightflow/shared';
import { RECEIVER } from '../config';
import type { CallsignMode } from '../hooks/useCallsignMode';
import type { ViewMode } from '../hooks/useViewMode';
import { IconButton } from './ui/IconButton';
import { Segmented } from './ui/Segmented';
import {
  CompassIcon,
  ExpandIcon,
  LayersIcon,
  LocateIcon,
  MinusIcon,
  PlusIcon,
  ShrinkIcon,
} from './ui/icons';

interface Props {
  map: MlMap | null;
  callsignMode: CallsignMode;
  onCallsignMode: (m: CallsignMode) => void;
  viewMode: ViewMode;
  onViewMode: (m: ViewMode) => void;
}

export function MapControls({ map, callsignMode, onCallsignMode, viewMode, onViewMode }: Props) {
  const [layersOpen, setLayersOpen] = useState(false);
  const [bearing, setBearing] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!map) return;
    const onRotate = () => setBearing(map.getBearing());
    map.on('rotate', onRotate);
    return () => {
      map.off('rotate', onRotate);
    };
  }, [map]);

  useEffect(() => {
    const onFs = () => setFullscreen(document.fullscreenElement != null);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  useEffect(() => {
    if (!layersOpen) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setLayersOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setLayersOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [layersOpen]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  };

  const group = 'glass flex flex-col gap-0.5 rounded-xl p-1';

  return (
    <div
      ref={wrapRef}
      className="absolute right-3 top-[calc(3.5rem+env(safe-area-inset-top)+12px)] z-20 flex flex-col items-end gap-2 sm:right-4"
    >
      <div className={group}>
        <IconButton label={t('map.controls.zoomIn')} onClick={() => map?.zoomIn()}>
          <PlusIcon className="h-5 w-5" />
        </IconButton>
        <IconButton label={t('map.controls.zoomOut')} onClick={() => map?.zoomOut()}>
          <MinusIcon className="h-5 w-5" />
        </IconButton>
      </div>

      <div className={group}>
        <IconButton
          label={t('map.controls.locate')}
          onClick={() => map?.flyTo({ center: [RECEIVER.lon, RECEIVER.lat], zoom: 8, essential: true })}
        >
          <LocateIcon className="h-5 w-5" />
        </IconButton>
        <IconButton
          label={t('map.controls.north')}
          onClick={() => map?.easeTo({ bearing: 0, pitch: 0 })}
        >
          <CompassIcon
            className="h-5 w-5 transition-transform"
            style={{ transform: `rotate(${-bearing - 45}deg)` }}
          />
        </IconButton>
        <IconButton
          label={t('map.controls.layers')}
          active={layersOpen}
          onClick={() => setLayersOpen((o) => !o)}
          aria-expanded={layersOpen}
        >
          <LayersIcon className="h-5 w-5" />
        </IconButton>
        <IconButton
          label={fullscreen ? t('map.controls.exitFullscreen') : t('map.controls.fullscreen')}
          onClick={toggleFullscreen}
        >
          {fullscreen ? <ShrinkIcon className="h-5 w-5" /> : <ExpandIcon className="h-5 w-5" />}
        </IconButton>
      </div>

      {layersOpen && (
        <div className="glass absolute right-14 top-[108px] w-64 rounded-xl p-3">
          <p className="label-caps mb-2">{t('map.layers.callsigns')}</p>
          <Segmented<CallsignMode>
            size="sm"
            label={t('map.layers.callsigns')}
            value={callsignMode}
            onChange={onCallsignMode}
            options={[
              { value: 'all', label: t('map.layers.all') },
              { value: 'nearby', label: t('map.layers.nearby') },
              { value: 'off', label: t('map.layers.off') },
            ]}
          />
          <p className="label-caps mb-2 mt-4">{t('map.layers.view')}</p>
          <Segmented<ViewMode>
            size="sm"
            label={t('map.layers.view')}
            value={viewMode}
            onChange={onViewMode}
            options={[
              { value: 'physical', label: t('map.layers.radar') },
              { value: 'autoplay', label: t('map.layers.autoplay') },
            ]}
          />
        </div>
      )}
    </div>
  );
}
