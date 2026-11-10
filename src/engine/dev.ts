import type { GameState } from './types';
import { newGame } from './state';

export type DevJump = { id: string; label: string; make(): GameState };

const jumps: DevJump[] = [];

export function registerDevJump(j: DevJump): void {
  const i = jumps.findIndex((x) => x.id === j.id);
  if (i >= 0) jumps[i] = j;
  else jumps.push(j);
}

export function devJumps(): DevJump[] {
  return [...jumps];
}

export function devEnabled(search: string): boolean {
  return new URLSearchParams(search).get('dev') === '1';
}

registerDevJump({ id: 'kuba', label: 'misja 1', make: () => newGame() });
