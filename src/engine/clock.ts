import type { Day, GameState } from './types';

export const DAYS: Day[] = ['pon', 'wt', 'śr', 'czw', 'pt', 'sob', 'nd'];
export const DAY_LONG: Record<Day, string> = {
  pon: 'poniedziałek',
  wt: 'wtorek',
  'śr': 'środa',
  czw: 'czwartek',
  pt: 'piątek',
  sob: 'sobota',
  nd: 'niedziela',
};
export const MAX_T = 23 * 60 + 59;
export const NEXT_DAY_T = 13 * 60 + 50;

export function nextDayName(d: Day): Day {
  return DAYS[(DAYS.indexOf(d) + 1) % DAYS.length];
}

export function hhmm(t: number): string {
  const h = Math.floor(t / 60);
  const m = t % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function gclk(s: GameState, t: number = s.t): string {
  return `${s.day} ${hhmm(t)}`;
}

export function dur(m: number): string {
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`;
}

export function advance(s: GameState, gameMin: number, deviceMin = 0): GameState {
  return {
    ...s,
    t: Math.min(s.t + gameMin, MAX_T),
    devices: s.devices.map((d) =>
      d.where === 'S1' ? { ...d, minutes: Math.max(0, d.minutes - deviceMin) } : d,
    ),
  };
}

export function dayVars(s: GameState): Record<string, string> {
  return { 'dzień': s.day, 'dzień_długi': DAY_LONG[s.day] };
}
