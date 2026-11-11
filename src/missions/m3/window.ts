// Okno czasowe zlecenia L.: oś czasu kamer (minuty dnia). Czyste funkcje, bez mutacji wejścia.
import type { CamLog, M3State, M3Window } from './state';
import { offAt } from './state';
import { M3_ROUTE } from './cams';

const activeAt = (c: CamLog, ip: string, t: number): boolean =>
  c.ip === ip && c.off <= t && (c.on === null || c.on > t);

/** Wyłącza kamerę od `t` (camOff, makieta linia 1699); `null`, gdy już wyłączona. */
export function camOffAt(m: M3State, ip: string, t: number, src: 'man' | 'at'): M3State | null {
  if (m.log.some((c) => activeAt(c, ip, t))) return null;
  return { ...m, log: [...m.log, { ip, off: t, on: null, src }] };
}

/** Włącza kamerę w `t` (camOn, linia 1700); `null`, gdy działa. */
export function camOnAt(m: M3State, ip: string, t: number): M3State | null {
  const i = m.log.findIndex((c) => activeAt(c, ip, t));
  if (i < 0) return null;
  return { ...m, log: m.log.map((c, j) => (j === i ? { ...c, on: t } : c)) };
}

/** Kamery wyłączone ręcznie bez końca w minucie `t` (manualOff, linia 1812). */
export function manualOff(m: M3State, t: number): CamLog[] {
  return offAt(m, t).filter((c) => c.on === null);
}

/** Obie kamery z trasy mają zadanie at dokładnie od startu okna (linia 1821). */
export function atReady(m: M3State): boolean {
  return M3_ROUTE.every((ip) => m.log.some((c) => c.ip === ip && c.src === 'at' && c.off === m.win.start));
}

/** Zadania at obu kamer z trasy obejmują całe okno `w`. */
export function atCovers(m: M3State, w: M3Window): boolean {
  return M3_ROUTE.every((ip) => m.log.some((c) => c.ip === ip && c.src === 'at'
    && c.off <= w.start && c.on !== null && c.on >= w.start + w.len));
}

/** Zadania at od minuty `from` przepadają (podsłuch padł). */
export function dropJobsFrom(m: M3State, from: number): { m: M3State; dropped: number } {
  const log = m.log.filter((c) => !(c.src === 'at' && c.off >= from));
  const dropped = m.log.length - log.length;
  return { m: dropped ? { ...m, log } : m, dropped };
}
