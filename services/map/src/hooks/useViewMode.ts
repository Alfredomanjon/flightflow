import { useEffect, useState } from 'react';

export type ViewMode = 'physical' | 'autoplay';

const STORAGE_KEY = 'ff:map:view-mode';

function readStored(): ViewMode {
  if (typeof window === 'undefined') return 'physical';
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === 'autoplay' ? 'autoplay' : 'physical';
}

export function useViewMode(): [ViewMode, (m: ViewMode) => void] {
  const [mode, setMode] = useState<ViewMode>(readStored);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  return [mode, setMode];
}
