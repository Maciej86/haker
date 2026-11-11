import type { GameState, Line, StepResult, UiEvent } from './types';
import { step } from './types';
import { missionDef, failMission } from './missions';
import type { Store } from './store';
import { S1_SOURCE } from './devices';
import { CRACK_SOURCE, DOWNLOAD_SOURCE, TRACE_FALL_SOURCE } from './server';

export type RealtimeSource = {
  id: string;
  /** Gdy aktywne, wstrzymuje zużycie podsłuchu przy S1 (pobieranie, Wytrych z namierzaniem, minuty „na żywo”). */
  pausesS1?: boolean;
  /** Gdy aktywne przy wczytaniu zapisu, pętla startuje w pauzie (minuty „na żywo” nie lecą bez gracza). */
  holdOnLoad?: boolean;
  active(s: GameState): boolean;
  tick(s: GameState, ms: number): StepResult;
};

const deadlineSource: RealtimeSource = {
  id: 'deadline',
  active: (s) => {
    const d = missionDef(s.active)?.deadline;
    return !!d && s.t > d.time && !s.failed && s.overlay === null;
  },
  tick: (s) => missionDef(s.active)?.onDeadline?.(s) ?? failMission(s),
};

// Funkcja, nie stała: devices.ts i realtime.ts importują się nawzajem, S1_SOURCE czytamy dopiero przy ticku.
const builtin = (): RealtimeSource[] => [deadlineSource, S1_SOURCE, CRACK_SOURCE, DOWNLOAD_SOURCE, TRACE_FALL_SOURCE];
let registered: RealtimeSource[] = [];

export function registerRealtime(src: RealtimeSource): void {
  const i = registered.findIndex((x) => x.id === src.id);
  if (i >= 0) registered[i] = src;
  else registered.push(src);
}

export function clearRealtime(): void {
  registered = [];
}

/** Wbudowane, zarejestrowane i źródła aktywnej misji. */
export function realtimeSources(s: GameState): RealtimeSource[] {
  return [...builtin(), ...registered, ...(missionDef(s.active)?.realtime ?? [])];
}

/** Po odświeżeniu strony pętla ma stać: aktywne źródło z `holdOnLoad`. */
export function holdsOnLoad(s: GameState): boolean {
  return realtimeSources(s).some((r) => r.holdOnLoad && r.active(s));
}

export function realtimeTick(s: GameState, ms: number): StepResult {
  const sources = realtimeSources(s);
  let cur = s;
  const lines: Line[] = [];
  const ui: UiEvent[] = [];
  let s1Ran = false;
  for (const src of sources) {
    // 's1' i źródła z pausesS1 wykluczają się; gdy 's1' w tym tiku wprowadziło grę w takie źródło, ono rusza od następnego tiku.
    if (src.pausesS1 && s1Ran) continue;
    if (!src.active(cur)) continue;
    if (src.id === S1_SOURCE.id) s1Ran = true;
    const r = src.tick(cur, ms);
    cur = r.state;
    lines.push(...r.lines);
    ui.push(...r.ui);
  }
  return cur === s && lines.length === 0 && ui.length === 0 ? step(s) : step(cur, lines, ui);
}

export function realtimeSpeed(search: string): number {
  return new URLSearchParams(search).get('dev') === '1' ? 10 : 1;
}

export type RealtimeLoop = {
  tick(ms: number): void;
  setHidden(h: boolean): void;
  paused(): boolean;
  resume(): void;
  subscribe(fn: () => void): () => void;
};

export function createRealtimeLoop(
  store: Store,
  opts: { speed: number; isHidden: () => boolean; startPaused?: boolean },
): RealtimeLoop {
  let paused = !!opts.startPaused;
  const subs: (() => void)[] = [];
  const setPaused = (p: boolean) => {
    if (paused === p) return;
    paused = p;
    for (const fn of [...subs]) fn();
  };
  return {
    tick(ms) {
      if (paused) return;
      if (opts.isHidden()) { setPaused(true); return; }
      const before = store.get();
      const r = realtimeTick(before, ms * opts.speed);
      if (r.state !== before || r.lines.length > 0 || r.ui.length > 0) store.apply(r);
    },
    setHidden(h) { if (h) setPaused(true); },
    paused: () => paused,
    resume: () => setPaused(false),
    subscribe(fn) {
      subs.push(fn);
      return () => { const i = subs.indexOf(fn); if (i >= 0) subs.splice(i, 1); };
    },
  };
}
