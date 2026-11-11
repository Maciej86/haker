// Stany startowe i skoki deweloperskie zlecenia W. (?dev=1). Import w src/missions/index.ts.
import type { GameState } from '../../engine/types';
import { newGame } from '../../engine/state';
import { nextDay } from '../../engine/clock';
import { acceptOffer } from '../../engine/missions';
import { registerDevJump } from '../../engine/dev';
import { initTripState } from '../../engine/trip';
import { runLine } from '../../engine/terminal';
import { endCrack } from '../../engine/server';

/** „start W.”: czw 13:50, 300 ¤ (100 − 100 za Wytrycha + 300 za Kubę), oferta W. nieprzeczytana. */
export function wStartState(seed = 1): GameState {
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

/** „W. po wyjeździe”: czw 16:05, 242 ¤ (300 − 58 ¤ samochodem), świeży PODSŁUCH-1 przy S1; punkt dnia z 13:50. */
export function wAfterTripState(seed = 1): GameState {
  const s = acceptOffer(wStartState(seed), 'w').state;
  return {
    ...s,
    t: 16 * 60 + 5,
    money: 242,
    devices: [{ id: 'bug1', where: 'S1', minutes: 60 }],
    screen: 'desktop',
    trip: initTripState(),
  };
}

/** „W. na serwerze”: po udanym Wytrychu, w / serwera banku (use S1, scan, probe, crack, wygrana). */
export function wOnServerState(seed = 1): GameState {
  let s = wAfterTripState(seed);
  for (const c of ['use S1', 'scan', 'probe 10.42.7.12', 'crack 10.42.7.12']) s = runLine(s, c).state;
  return endCrack(s, 'ok').state;
}

registerDevJump({ id: 'w-start', label: 'start W.', make: () => wStartState() });
registerDevJump({ id: 'w-after-trip', label: 'W. po wyjeździe', make: () => wAfterTripState() });
registerDevJump({ id: 'w-on-server', label: 'W. na serwerze', make: () => wOnServerState() });
