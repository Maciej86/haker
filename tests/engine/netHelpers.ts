import type { Device, GameState } from '../../src/engine/types';
import { game } from './fixtures';

export function afterKuba(devices: Device[] = []): GameState {
  const g = game();
  return {
    ...g,
    done: ['kuba'],
    day: 'czw',
    t: 830,
    money: 300,
    owned: [...g.owned, 'wyt'],
    mail: { ...g.mail, hidden: [] },
    devices,
  };
}

export const atS1 = (minutes: number): Device => ({ id: 'bug1', where: 'S1', minutes });
export const inPack = (): Device => ({ id: 'bug1', where: 'plecak', minutes: 60 });

export function linked(s: GameState): GameState {
  return { ...s, terminal: { ...s.terminal, location: { kind: 'S1' } } };
}
