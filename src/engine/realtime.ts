import type { GameState, Line, StepResult, UiEvent } from './types';
import { step } from './types';
import { missionDef, failMission } from './missions';
import type { Store } from './store';

export type RealtimeSource = {
  id: string;
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

const builtin: RealtimeSource[] = [deadlineSource];
let registered: RealtimeSource[] = [];

export function registerRealtime(src: RealtimeSource): void {
  const i = registered.findIndex((x) => x.id === src.id);
  if (i >= 0) registered[i] = src;
  else registered.push(src);
}

export function clearRealtime(): void {
  registered = [];
}

export function realtimeTick(s: GameState, ms: number): StepResult {
  const sources = [...builtin, ...registered, ...(missionDef(s.active)?.realtime ?? [])];
  let cur = s;
  const lines: Line[] = [];
  const ui: UiEvent[] = [];
  for (const src of sources) {
    if (!src.active(cur)) continue;
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
  opts: { speed: number; isHidden: () => boolean },
): RealtimeLoop {
  let paused = false;
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
