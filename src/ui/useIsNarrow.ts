import { useSyncExternalStore } from 'react';

export const NARROW_MAX = 1024;

function subscribe(onChange: () => void) {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
}

function getSnapshot() {
  return window.innerWidth < NARROW_MAX;
}

export function useIsNarrow(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot);
}
