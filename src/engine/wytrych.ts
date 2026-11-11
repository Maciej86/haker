// Okno Wytrych: widok i akcje. Silnik nie zna trybów misji — pyta hook `MissionDef.wytrych`.
import type { GameState, StepResult } from './types';
import { step } from './types';
import { focusMission, missionDef } from './missions';
import type { WiresView } from './wires';

export type BakeItem = 'chleb' | 'bulka' | 'rogal' | '+' | '×' | '−';
export type BakeView = {
  rows: { items: BakeItem[]; result: number | null }[];
  won: boolean;
  answer: number | null;     // tylko po złamaniu
  tries: number;
  hints: string[];           // odsłonięte podpowiedzi
  hintsLeft: number;
  wrong: string | null;      // ostatnia zła odpowiedź (już po esc)
};
export type WytrychView = { title: string } & ({ mode: 'none' } | { mode: 'bake'; bake: BakeView } | { mode: 'wires'; wires: WiresView });
export type WytrychAction = { kind: 'answer'; value: string } | { kind: 'hint' } | { kind: 'turn'; r: number; c: number; dir: 1 | 3 };

export function wytrychView(s: GameState): WytrychView {
  return missionDef(focusMission(s))?.wytrych?.view(s) ?? { title: 'Wytrych 1.0', mode: 'none' };
}

export function wytrychAct(s: GameState, a: WytrychAction): StepResult {
  return missionDef(focusMission(s))?.wytrych?.act(s, a) ?? step(s);
}
