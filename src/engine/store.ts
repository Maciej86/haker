import type { GameState, Line, StepResult, UiEvent } from './types';
import { SAVE_KEY, serialize } from './state';
import { loadProfile, mergeProfile, saveProfile } from './profile';

export const MAX_LINES = 500;

export type Store = {
  get(): GameState;
  apply(r: StepResult | GameState): void;
  subscribe(fn: () => void): () => void;
  onUi(fn: (e: UiEvent) => void): () => void;
  lines(): Line[];
};

const isStep = (r: StepResult | GameState): r is StepResult =>
  'state' in r && 'lines' in r;

export function createStore(init: GameState, opts: { persist?: Storage | null } = {}): Store {
  const persist = opts.persist ?? null;
  let state = init;
  const subs: (() => void)[] = [];
  const uiSubs: ((e: UiEvent) => void)[] = [];
  const remove = <T,>(arr: T[], fn: T) => () => {
    const i = arr.indexOf(fn);
    if (i >= 0) arr.splice(i, 1);
  };

  function save(prev: GameState, next: GameState) {
    if (!persist) return;
    try {
      if (next.screen !== 'trip') persist.setItem(SAVE_KEY, serialize(next));
    } catch { /* pełny lub niedostępny Storage */ }
    try {
      if (next.done.length > prev.done.length) {
        saveProfile(persist, mergeProfile(loadProfile(persist), next));
      }
    } catch { /* j.w. */ }
  }

  return {
    get: () => state,
    lines: () => state.terminal.lines,
    subscribe(fn) { subs.push(fn); return remove(subs, fn); },
    onUi(fn) { uiSubs.push(fn); return remove(uiSubs, fn); },
    apply(r) {
      const prev = state;
      let next: GameState;
      let ui: UiEvent[] = [];
      if (isStep(r)) {
        ui = r.ui;
        next = r.lines.length
          ? { ...r.state, terminal: { ...r.state.terminal, lines: [...r.state.terminal.lines, ...r.lines].slice(-MAX_LINES) } }
          : r.state;
      } else {
        next = r;
      }
      state = next;
      save(prev, next);
      for (const fn of [...subs]) fn();
      for (const e of ui) for (const fn of [...uiSubs]) fn(e);
    },
  };
}
