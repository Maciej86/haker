import type { GameState, MailMsg, StepResult } from '../../../src/engine/types';
import { runLine } from '../../../src/engine/terminal';
import { deliver } from '../../../src/engine/delivery';
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

/** Droga tam udana przez at, gracz w domu: czw 21:15, leg 2, wiadomość 21:45, okno powrotu 21:50. */
export const okLeg1 = (): GameState => runLine(home(atBothAt(cams())), 'wait 21:15').state;
/** Wiadomość L. przyszła (21:45), dom, minuty na żywo. */
export const back = (): GameState => runLine(okLeg1(), 'wait 21:45').state;
/** Zadania at na okno powrotu 21:50 dla obu kamer z trasy (wymaga połączenia z S1). */
export const atBack = (s: GameState): GameState =>
  run(s, 'at 21:50 cam off 10.42.5.31 3m', 'at 21:50 cam off 10.42.5.33 3m').state;
/** Powrót udany przez at: ok, dom, 21:51. */
export const cleanBack = (): GameState => run(atBack(run(back(), 'use S1').state), 'disconnect', 'wait 21:51').state;
export const report = (s: GameState, text = 'Zrobione. Kamery posprzątane.'): StepResult => deliver(s, 'm3', text);
export const lastMail = (s: GameState): MailMsg => s.mail.threads.m3.at(-1)!;
