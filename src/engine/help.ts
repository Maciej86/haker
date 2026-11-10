import type { GameState } from './types';

export type HelpEntry = { cmd: string; desc: string; cost: string; insert?: string };
export type HelpGroup = {
  title: string;
  unlocked: (s: GameState) => boolean;
  entries: HelpEntry[];
  need?: string;
};
