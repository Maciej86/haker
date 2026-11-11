// Przejścia całego demo skryptem (plan 32): Kuba, potem W. i L. w dowolnej kolejności. Czyste funkcje silnika.
import type { GameState, MissionId } from '../../../src/engine/types';
import { nextDay } from '../../../src/engine/clock';
import { acceptOffer } from '../../../src/engine/missions';
import { deliver } from '../../../src/engine/delivery';
import { bugAtS1 } from '../../../src/engine/devices';
import { initTripState } from '../../../src/engine/trip';
import { endCrack } from '../../../src/engine/server';
import { kubaAccepted, run, withKuba } from '../kuba/helpers';
import { cleanLog, gotV2, home as wHome, sendV2 } from '../w/helpers';
import { report } from '../m3/helpers';
import '../../../src/missions';

const ZENEK = '83.21.40.17';

/** Kuba skrótem (plan 11), potem następny dzień: czw 13:50, oferty W. i L. */
export function kubaDay(): GameState {
  const s = run(withKuba({ ...kubaAccepted(), owned: ['cpu1', 'net2', 'wyt'] }, { conn: true, cracked: true }),
    `connect ${ZENEK}`, 'get playlista.txt', 'disconnect').state;
  const done = deliver(s, 'kuba', 'Proszę bardzo.', `${ZENEK}:playlista.txt`).state;
  return nextDay(done).state;
}

/** Wyjazd skrótem: godzina po powrocie jak w `wAfterTripState` / `m3AfterTripState`. */
const TRIP_BACK: Record<'w' | 'm3', number> = { w: 16 * 60 + 5, m3: 17 * 60 + 30 };

/** Przyjęcie oferty; bez podsłuchu przy S1 wyjazd skrótem (58 ¤ samochodem, świeży PODSŁUCH-1). */
export function take(s: GameState, id: 'w' | 'm3', keepBug: boolean): GameState {
  const pre: GameState = keepBug ? s : { ...s, devices: [] };
  const had = bugAtS1(pre);
  const acc = acceptOffer(pre, id as MissionId).state;
  if (had) return acc;
  return {
    ...acc,
    t: TRIP_BACK[id],
    money: acc.money - 58,
    devices: [{ id: 'bug1', where: 'S1', minutes: 60 }],
    screen: 'desktop',
    trip: { ...initTripState(), mission: id, last: 'ok', trips: 1 },
  };
}

/** W. od przyjęcia do wysłania V2 (sekwencja z planu 22). */
export function playW(s: GameState): GameState {
  const c = run(s, 'use S1', 'scan', 'scan --type serwer', 'probe 10.42.7.12', 'crack 10.42.7.12').state;
  return sendV2(wHome(cleanLog(gotV2(endCrack(c, 'ok').state)))).state;
}

/** L. od przyjęcia do raportu: droga tam i z powrotem przez zadania at. */
export function playL(s: GameState): GameState {
  const r = run(s, 'use S1', 'scan', 'probe 10.42.5.31', 'probe 10.42.5.33',
    'at 21:14 cam off 10.42.5.31 3m', 'at 21:14 cam off 10.42.5.33 3m', 'disconnect', 'wait 21:15', 'wait 21:45',
    'use S1', 'at 21:50 cam off 10.42.5.31 3m', 'at 21:50 cam off 10.42.5.33 3m', 'disconnect', 'wait 21:51').state;
  return report(r).state;
}
