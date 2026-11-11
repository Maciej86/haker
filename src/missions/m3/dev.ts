// Stany startowe i skoki deweloperskie zlecenia L. (?dev=1). Import w src/missions/index.ts.
import type { GameState } from '../../engine/types';
import { newGame } from '../../engine/state';
import { nextDay } from '../../engine/clock';
import { acceptOffer } from '../../engine/missions';
import { registerDevJump } from '../../engine/dev';
import { initTripState } from '../../engine/trip';
import { runLine } from '../../engine/terminal';

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

/** Polecenia po kolei, przez Terminal (linie wyniku pomijamy: skok startuje z czystym stanem). */
function typed(s: GameState, ...lines: string[]): GameState {
  return lines.reduce((x, l) => runLine(x, l).state, s);
}

/** „L. przed oknem”: kamery z trasy znane, rozłączony, czw 17:47, zapas 51 min, etap 4. */
export function m3BeforeWindowState(seed = 1): GameState {
  return typed(m3AfterTripState(seed), 'use S1', 'scan', 'probe 10.42.5.31', 'probe 10.42.5.33', 'disconnect');
}

/** „L. minuty na żywo”: jak wyżej, ale 21:10 i `use S1`, czyli 21:12 na żywo, bez zadań `at`. */
export function m3LiveState(seed = 1): GameState {
  return typed({ ...m3BeforeWindowState(seed), t: 21 * 60 + 10, sec: 0 }, 'use S1');
}

registerDevJump({ id: 'm3-start', label: 'start L.', make: () => m3StartState() });
registerDevJump({ id: 'm3-after-trip', label: 'L. po wyjeździe', make: () => m3AfterTripState() });
registerDevJump({ id: 'm3-before-window', label: 'L. przed oknem', make: () => m3BeforeWindowState() });
registerDevJump({ id: 'm3-live', label: 'L. minuty na żywo', make: () => m3LiveState() });
