import type { GameState } from '../../src/engine/types';
import { NEXT_DAY_T } from '../../src/engine/clock';
import { game } from '../engine/fixtures';

export function day2(): GameState {
  return game({ day: 'czw', t: NEXT_DAY_T, done: ['kuba'], mail: { ...game().mail, read: ['kuba'], hidden: [] } });
}
