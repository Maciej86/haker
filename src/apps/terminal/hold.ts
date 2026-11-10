import { useSyncExternalStore } from 'react';
import type { Line } from '../../engine/types';
import { pushToast } from '../../ui/Toast';

// Wstrzymanie Terminala na czas pobierania (UiEvent 'termHold'). Timer żyje poza komponentem,
// więc zamknięcie/otwarcie okna w trakcie niczego nie dubluje. Linie „po” są już w stanie gry; tu je tylko ukrywamy.
export type Hold = { bar: Line; after: Set<Line>; pct: number };

let hold: Hold | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
const subs = new Set<() => void>();
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
const emit = () => subs.forEach((f) => f());

function stop(): void {
  if (timer !== null) clearInterval(timer);
  timer = null;
  hold = null;
}

export function startTermHold(e: { ms: number; steps: number; bar: Line; after: Line[]; toast?: string }): void {
  stop();
  const steps = Math.max(1, e.steps);
  let n = 0;
  hold = { bar: e.bar, after: new Set(e.after), pct: 0 };
  emit();
  timer = setInterval(() => {
    n++;
    if (n >= steps) {
      stop();
      emit();
      if (e.toast) pushToast(e.toast);
      return;
    }
    hold = { ...hold!, pct: Math.round((n * 100) / steps) };
    emit();
  }, e.ms / steps);
}

/** Nowa gra: przerywa trwające wstrzymanie bez toastu. */
export function clearTermHold(): void {
  stop();
  emit();
}

export function useTermHold(): Hold | null {
  return useSyncExternalStore(subscribe, () => hold);
}
