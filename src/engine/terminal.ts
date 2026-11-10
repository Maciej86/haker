import type { GameState, StepResult } from './types';

export type Command = (args: string[], s: GameState) => StepResult;
export type CommandTable = Record<string, Command>;
