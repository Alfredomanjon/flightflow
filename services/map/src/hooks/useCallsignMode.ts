import { useEffect, useState } from 'react';

export type CallsignMode = 'off' | 'nearby' | 'all';

const STORAGE_KEY = 'ff:map:callsign-mode';

function readStored(): CallsignMode {
  if (typeof window === 'undefined') return 'all';
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === 'off' || v === 'nearby' || v === 'all' ? v : 'all';
}

export function useCallsignMode(): [CallsignMode, (m: CallsignMode) => void] {
  const [mode, setMode] = useState<CallsignMode>(readStored);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  return [mode, setMode];
}
