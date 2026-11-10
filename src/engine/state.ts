import type { GameState, Line } from './types';
import { DAYS, gclk } from './clock';
import { missionDef } from './missions';
import { MISSION_ORDER } from '../missions';
import { initKubaState } from '../missions/kuba/state';
import { initWState } from '../missions/w/state';
import { initM3State } from '../missions/m3/state';
import { initNetState } from './network';
import { initTripState } from './trip';

export const SAVE_KEY = 'neonos-save';
export const INTERRUPTED_LINE: Line = { html: '<span class="r">połączenie przerwane</span>' };

export function newGame(seed: number = Date.now() >>> 0): GameState {
  const base = {
    version: 1 as const,
    seed,
    screen: 'desktop' as const,
    overlay: null,
    mapCityTab: 'poznan' as const,
    mapCityDistrict: null,
    day: 'śr' as const,
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
    mail: {
      read: [],
      threads: {},
      hidden: MISSION_ORDER.filter((id) => missionDef(id).availability.afterMissions.length > 0) as string[],
      draft: {},
    },
    downloads: [],
    mission: { kuba: initKubaState(), w: initWState(), m3: initM3State() },
    dayCheckpoint: null,
    stats: { scans: 0, buys: 0, first: false },
    net: initNetState(),
    trip: initTripState(),
    summary: null,
    failed: false,
    summaryMeta: null,
    helpSeen: [],
  };
  const s = { ...base, terminal: { lines: [] as Line[], history: [] as string[], location: { kind: 'home' as const } } } as GameState;
  s.terminal.lines = [
    { html: '<span class="c">NeonOS 0.4</span>' },
    { html: `<span class="d">${gclk(s)} · ${missionDef(MISSION_ORDER[0]).introLine}</span>` },
    { html: '' },
  ];
  return s;
}

export function serialize(s: GameState): string {
  return JSON.stringify(s);
}

export function deserialize(raw: string | null): GameState | null {
  if (raw === null) return null;
  let o: unknown;
  try {
    o = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof o !== 'object' || o === null || Array.isArray(o)) return null;
  const g = o as Partial<GameState>;
  if (g.version !== 1 || typeof g.t !== 'number' || !DAYS.includes(g.day as never)) return null;
  return o as GameState;
}

export function interruptOnLoad(s: GameState): GameState {
  let n = s;
  if (n.screen === 'trip') n = { ...n, screen: 'desktop' };
  if (s.active) {
    const r = missionDef(s.active).interrupt?.(n);
    if (r) n = { ...r, terminal: { ...r.terminal, lines: [...r.terminal.lines, INTERRUPTED_LINE] } };
  }
  return n;
}
