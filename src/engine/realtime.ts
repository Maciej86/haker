import type { GameState, StepResult } from './types';

export type RealtimeSource = {
  id: string;
  active(s: GameState): boolean;
  tick(s: GameState, ms: number): StepResult;
};
