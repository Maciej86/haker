/** Wpis dziennika kamer (minuty dnia): wyłączona od `off`, włączona o `on` (null: nadal wyłączona). */
export type CamLog = { ip: string; off: number; on: number | null; src: 'man' | 'at'; caught?: boolean };
export type M3Window = { start: number; len: number };
export type M3State = { win: M3Window; log: CamLog[]; err: number };

/** Okno przejścia z windy do 712: 21:14, 3 min. */
export const M3_WINDOW: M3Window = { start: 21 * 60 + 14, len: 3 };

export function initM3State(): M3State {
  return { win: { ...M3_WINDOW }, log: [], err: 0 };
}

/** Kamera wyłączona w minucie `t` (camState z makiety, linia 1698). */
export function camIsOff(m: M3State, ip: string, t: number): boolean {
  return m.log.some((c) => c.ip === ip && c.off <= t && (c.on === null || c.on > t));
}

/** Wpisy kamer wyłączonych w minucie `t` (offNow, linia 1702). */
export function offAt(m: M3State, t: number): CamLog[] {
  return m.log.filter((c) => c.off <= t && (c.on === null || c.on > t));
}
