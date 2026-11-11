// Stany startowe i skoki deweloperskie zlecenia L. (?dev=1). Import w src/missions/index.ts.
import type { GameState } from '../../engine/types';
import { newGame } from '../../engine/state';
import { nextDay } from '../../engine/clock';
import { acceptOffer } from '../../engine/missions';
import { registerDevJump } from '../../engine/dev';
import { initTripState } from '../../engine/trip';

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

/** „L. po wyjeździe”: czw 17:30, 242 ¤ (300 − 58 ¤ samochodem), świeży PODSŁUCH-1 przy S1; punkt dnia z 13:50. */
export function m3AfterTripState(seed = 1): GameState {
  const s = acceptOffer(m3StartState(seed), 'm3').state;
  return {
    ...s,
    t: 17 * 60 + 30,
    money: 242,
    devices: [{ id: 'bug1', where: 'S1', minutes: 60 }],
    screen: 'desktop',
    trip: { ...initTripState(), mission: 'm3', last: 'ok', trips: 1 },
  };
}

registerDevJump({ id: 'm3-start', label: 'start L.', make: () => m3StartState() });
registerDevJump({ id: 'm3-after-trip', label: 'L. po wyjeździe', make: () => m3AfterTripState() });
