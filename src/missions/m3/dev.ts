// Stany startowe i skoki deweloperskie zlecenia L. (?dev=1). Import w src/missions/index.ts.
import type { GameState } from '../../engine/types';
import { newGame } from '../../engine/state';
import { nextDay } from '../../engine/clock';

/** „start L.”: czw 13:50, 300 ¤, po Kubie, bez urządzeń; oferty W. i L. nieprzeczytane. */
export function m3StartState(seed = 1): GameState {
  const base = newGame(seed);
  const wed: GameState = {
    ...base,
    money: 300,
    xp: 120,
    lvl: 1,
    skills: { 'Sieć': 2, Linux: 2, Skrypty: 0, Social: 1 },
    owned: ['cpu1', 'net2', 'wyt'],
    done: ['kuba'],
    devices: [],
  };
  return nextDay(wed).state; // czwartek 13:50, punkt dnia z tej chwili
}
