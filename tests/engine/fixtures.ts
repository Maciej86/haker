import type { GameState } from '../../src/engine/types';
import type { MissionId } from '../../src/engine/types';
import type { MissionDef } from '../../src/engine/missions';
import { MISSIONS } from '../../src/missions';
import { newGame } from '../../src/engine/state';

export function game(patch: Partial<GameState> = {}): GameState {
  return { ...newGame(1), ...patch };
}

export function memStorage(opts: { failWrites?: boolean } = {}): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; },
    clear: () => m.clear(),
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => { m.delete(k); },
    setItem: (k, v) => {
      if (opts.failWrites) throw new DOMException('quota', 'QuotaExceededError');
      m.set(k, String(v));
    },
  };
}

export function withMission(id: MissionId, patch: Partial<MissionDef>): () => void {
  const orig = MISSIONS[id];
  MISSIONS[id] = { ...orig, ...patch };
  return () => { MISSIONS[id] = orig; };
}
