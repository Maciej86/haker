import type { GameState } from '../../../src/engine/types';
import type { M3State } from '../../../src/missions/m3/state';
import { m3AfterTripState } from '../../../src/missions/m3/dev';
import { run } from '../kuba/helpers';

export { run, txt } from '../kuba/helpers';

/** Kamery z trasy znane, połączony z S1: czw 17:47, zapas 51 min. */
export const cams = (): GameState => run(m3AfterTripState(), 'use S1', 'scan', 'probe 10.42.5.31', 'probe 10.42.5.33').state;
export const m3 = (s: GameState): M3State => s.mission.m3;
export const atT = (s: GameState, t: number, sec = 0): GameState => ({ ...s, t, sec });
export const withM3 = (s: GameState, m: Partial<M3State>): GameState =>
  ({ ...s, mission: { ...s.mission, m3: { ...s.mission.m3, ...m } } });
export const home = (s: GameState): GameState =>
  ({ ...s, terminal: { ...s.terminal, location: { kind: 'home' as const } } });
export const atBothAt = (s: GameState): GameState =>
  run(s, 'at 21:14 cam off 10.42.5.31 3m', 'at 21:14 cam off 10.42.5.33 3m').state;
