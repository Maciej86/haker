import type { Day, GameState, Line, MissionId, StepResult, UiEvent } from './types';
import { step } from './types';
import { missionDef, visibleOffers } from './missions';

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

export function deadlineLabel(s: GameState): { text: string; red: boolean } | null {
  const time = missionDef(s.active)?.deadline?.time;
  if (time === undefined) return null;
  const left = time - s.t;
  return {
    text: `${s.day} ${hhmm(time)} · ${left > 0 ? 'zostało ' + dur(left) : 'po terminie'}`,
    red: left < 30,
  };
}

export function nextDay(s: GameState): StepResult {
  const revealed = s.mail.hidden.filter((id) =>
    missionDef(id as MissionId).availability.afterMissions.every((m) => s.done.includes(m)),
  );
  const cur: GameState = {
    ...s,
    day: nextDayName(s.day),
    t: NEXT_DAY_T,
    sec: 0,
    gains: [],
    screen: 'desktop',
    overlay: null,
    summary: null,
    summaryMeta: null,
    failed: false,
    mail: {
      ...s.mail,
      hidden: s.mail.hidden.filter((id) => !revealed.includes(id)),
      read: s.mail.read.filter((id) => !revealed.includes(id)),
    },
    terminal: { ...s.terminal, location: { kind: 'home' }, lines: [] },
  };
  const free = visibleOffers(cur).filter((id) => !cur.done.includes(id)).length;
  const text =
    free >= 2 ? 'nowy dzień. W Poczcie czekają dwie oferty. Przyjąć można jedną naraz.'
      : free === 1 ? 'nowy dzień. W Poczcie czeka oferta, która została z wczoraj.'
        : 'nowy dzień.';
  const lines: Line[] = [
    { html: '<span class="c">NeonOS 0.4</span>' },
    { html: `<span class="d">${gclk(cur)} · ${text}</span>` },
    { html: '' },
  ];
  const state: GameState = { ...cur, terminal: { ...cur.terminal, lines } };
  const { dayCheckpoint: _cp, ...rest } = state;
  const withCp: GameState = { ...state, dayCheckpoint: structuredClone(rest) };

  const ui: UiEvent[] = [];
  if (free >= 2) ui.push({ kind: 'toast', text: '2 nowe oferty w Poczcie' });
  else if (free === 1) ui.push({ kind: 'toast', text: 'Oferta z wczoraj czeka w Poczcie' });
  ui.push({ kind: 'open', app: 'terminal' }, { kind: 'open', app: 'mail' });
  return step(withCp, [], ui);
}
