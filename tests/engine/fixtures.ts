import type { GameState } from '../../src/engine/types';
import { initKubaState } from '../../src/missions/kuba/state';
import { initWState } from '../../src/missions/w/state';
import { initM3State } from '../../src/missions/m3/state';
import { initNetState } from '../../src/engine/network';
import { initTripState } from '../../src/engine/trip';

// Do czasu Task 4 (newGame) stan budowany ręcznie. Wartości startowe: śr 20:30, 100 ¤, 40 XP.
export function game(patch: Partial<GameState> = {}): GameState {
  const base: GameState = {
    version: 1,
    seed: 1,
    screen: 'desktop',
    overlay: null,
    mapCityTab: 'nt',
    mapCityDistrict: null,
    day: 'śr',
    t: 20 * 60 + 30,
    sec: 0,
    money: 100,
    xp: 40,
    lvl: 1,
    skills: { 'Sieć': 1.6, Linux: 1.5, Skrypty: 0, Social: 1 },
    gains: [],
    owned: ['cpu1', 'net2'],
    hw: { cpu: 1.1, ram: 4, net: 2, netName: 'ADSL' },
    done: [],
    active: null,
    devices: [],
    mail: { read: [], threads: {}, hidden: [], draft: {} },
    downloads: [],
    terminal: { lines: [], history: [], location: { kind: 'home' } },
    mission: { kuba: initKubaState(), w: initWState(), m3: initM3State() },
    dayCheckpoint: null,
    stats: { scans: 0, buys: 0, first: true },
    net: initNetState(),
    trip: initTripState(),
    summary: null,
    failed: false,
    summaryMeta: null,
    helpSeen: [],
  };
  return { ...base, ...patch };
}
