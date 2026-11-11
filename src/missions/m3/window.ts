// Okno czasowe zlecenia L.: oś czasu kamer (minuty dnia). Czyste funkcje, bez mutacji wejścia.
import type { GameState, StepResult } from '../../engine/types';
import { step } from '../../engine/types';
import type { CamHooks } from '../../engine/commands/cams';
import { camCommands } from '../../engine/commands/cams';
import type { CommandTable } from '../../engine/terminal';
import { notFound } from '../../engine/terminal';
import type { CamLog, M3State, M3Window } from './state';
import { CAM_MAX, camIsOff, offAt } from './state';
import { M3_ROUTE } from './cams';
import { M3_AT_READY, M3_JOBS_LOST } from './texts';

const withM = (s: GameState, m: M3State): GameState => ({ ...s, mission: { ...s.mission, m3: m } });

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

/** Hooki poleceń cam/at/wait dla zlecenia L. */
export const M3_CAM_HOOKS: CamHooks = {
  max: CAM_MAX,
  isOff: (s, ip) => camIsOff(s.mission.m3, ip, s.t),
  off: (s, ip) => { const m = camOffAt(s.mission.m3, ip, s.t, 'man'); return m ? withM(s, m) : s; },
  on: (s, ip) => { const m = camOnAt(s.mission.m3, ip, s.t); return m ? withM(s, m) : s; },
  addJob: (s, j) => withM(s, { ...s.mission.m3, log: [...s.mission.m3.log, { ip: j.ip, off: j.off, on: j.off + j.min, src: 'at' }] }),
  jobs: (s) => s.mission.m3.log.filter((c) => c.src === 'at').map((c) => ({ ip: c.ip, off: c.off, min: (c.on ?? c.off) - c.off })),
  afterAt: (s) => (M3_ROUTE.every((ip) => s.mission.m3.log.some((c) => c.ip === ip && c.src === 'at')) ? [{ html: M3_AT_READY }] : []),
  lost: (s, from) => {
    const r = dropJobsFrom(s.mission.m3, from);
    return r.dropped > 0 ? step(withM(s, r.m), [{ html: M3_JOBS_LOST }]) : step(s);
  },
  after: (s): StepResult => step(s),
};

/** cam/at/wait tylko w przyjętym zleceniu L.; przed przyjęciem (gdy L. jest jedyną ofertą) zwykłe „nie znaleziono”. */
export const M3_COMMANDS: CommandTable = Object.fromEntries(
  Object.entries(camCommands(M3_CAM_HOOKS)).map(([k, f]) => [k, (a: string[], s: GameState) => (s.active === 'm3' ? f(a, s) : notFound(s, k))]),
);
