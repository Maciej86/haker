// Skoki deweloperskie podsłuchu (?dev=1). Import w src/main.tsx (jak plan 04: nie w engine/dev.ts, cykl importów).
// Plan 20 może podmienić `make` na stan W. po wyjeździe (to samo id zastępuje wpis).
import { registerDevJump } from '../engine/dev';
import { acceptOffer } from '../engine/missions';
import { newGame } from '../engine/state';
import type { GameState } from '../engine/types';

const base = (): GameState => {
  const g = newGame();
  return acceptOffer({ ...g, done: ['kuba'], day: 'czw', t: 830, money: 300, owned: [...g.owned, 'wyt'], mail: { ...g.mail, hidden: [] } }, 'w').state;
};

// W. po wyjeździe, czw 16:05 (jak misja.html?t=965).
const afterTrip = (minutes: number, linked: boolean): GameState => {
  const b = base();
  return {
    ...b,
    t: 965,
    trip: { mission: 'w', last: 'ok', trips: 1, suspicious: false },
    devices: [{ id: 'bug1', where: 'S1', minutes }],
    terminal: { ...b.terminal, location: linked ? { kind: 'S1' } : { kind: 'home' } },
  };
};

registerDevJump({ id: 'bug-low', label: 'mało czasu urządzenia', make: () => afterTrip(2, true) });
registerDevJump({ id: 'bug-dead', label: 'urządzenie wyczerpane', make: () => afterTrip(0, false) });
