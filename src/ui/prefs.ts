import { useSyncExternalStore } from 'react';

export type PrefKey = 'neonos-theme' | 'neonos-rain' | 'neonos-coach';

const listeners = new Set<() => void>();
const memory = new Map<string, string>();

export function getPref(k: PrefKey, fallback: string): string {
  try {
    const v = localStorage.getItem(k);
    if (v !== null) return v;
  } catch {
    /* zablokowany localStorage: używamy pamięci */
  }
  return memory.get(k) ?? fallback;
}

export function setPref(k: PrefKey, v: string): void {
  memory.set(k, v);
  try {
    localStorage.setItem(k, v);
  } catch {
    /* zablokowany localStorage: wartość zostaje tylko w pamięci */
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => { listeners.delete(l); };
};

export function usePref(k: PrefKey, fallback: string): [string, (v: string) => void] {
  const v = useSyncExternalStore(subscribe, () => getPref(k, fallback), () => fallback);
  return [v, (x) => setPref(k, x)];
}
