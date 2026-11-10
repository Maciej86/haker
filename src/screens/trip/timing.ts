// Czasy animacji odcinków wyjazdu (wyjazd.tpl.html 283–304) i wygładzanie ruchu (277).
import { hhmm } from '../../engine/clock';

export const LEG_MS = {
  train: { walk1: 2600, wait1: 900, ride1: 3200, walk2: 2800 },
  car: { walk1: 2000, ride1: 3000, drive2: 2600, park: 900, walk2: 1400 },
  back: 3200,
} as const;

export const ease = (k: number): number => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

/** Godzina z minut; po północy zawija się (25:11 → 01:11). Ułamek minuty w trakcie animacji jest obcinany. */
export const hm = (m: number): string => hhmm(Math.floor(m) % 1440);
