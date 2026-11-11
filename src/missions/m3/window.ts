// Okno czasowe zlecenia L.: oś czasu kamer (minuty dnia). Czyste funkcje, bez mutacji wejścia.
import type { GameState, Line, StepResult, UiEvent, WalkSpec } from '../../engine/types';
import { andThen, step } from '../../engine/types';
import { gclk, hhmm } from '../../engine/clock';
import { fill } from '../../engine/text';
import { gain } from '../../engine/skills';
import { failMission } from '../../engine/missions';
import { bugAtS1 } from '../../engine/devices';
import { isLinkedToS1 } from '../../engine/commands/basic';
import { leaveS1 } from '../../engine/commands/field';
import type { CamHooks } from '../../engine/commands/cams';
import { camCommands } from '../../engine/commands/cams';
import type { CommandTable } from '../../engine/terminal';
import { notFound } from '../../engine/terminal';
import type { CamLog, M3State, M3Window } from './state';
import { CAM_MAX, M3_BACK_LEAD, M3_NOTICE_AFTER, M3_RETRY_START, camIsOff, offAt } from './state';
import { M3_CAMS, M3_ROUTE } from './cams';
import { PLAN_ROUTE } from './plan';
import {
  M3_AT_READY, M3_EARLY, M3_FAIL_LINE, M3_JOBS_LOST, M3_LATE, M3_LATE_BACK, M3_LATE_THERE, M3_OVERFLOW, M3_OVERFLOW_FAIL,
  M3_OVERFLOW_LINE, M3_OVERFLOW_MAIL, M3_OVERFLOW_TOAST, M3_RETRY_3, M3_RETRY_EARLY, M3_RETRY_LATE, M3_RETRY_LINE,
  M3_RETRY_TOAST_EARLY, M3_RETRY_TOAST_LATE, M3_THERE_LINE, M3_THERE_MAIL, M3_THERE_TOAST, M3_WINDOW_FAIL,
} from './texts';

const withM = (s: GameState, m: M3State): GameState => ({ ...s, mission: { ...s.mission, m3: m } });

const activeAt = (c: CamLog, ip: string, t: number): boolean =>
  c.ip === ip && c.off <= t && (c.on === null || c.on > t);

/** Wyłącza kamerę od `t` (camOff, makieta linia 1699); `null`, gdy już wyłączona. */
export function camOffAt(m: M3State, ip: string, t: number, src: 'man' | 'at'): M3State | null {
  if (m.log.some((c) => activeAt(c, ip, t))) return null;
  return { ...m, log: [...m.log, { ip, off: t, on: null, src }] };
}

/** Włącza kamerę w `t` (camOn, linia 1700); `null`, gdy działa. */
export function camOnAt(m: M3State, ip: string, t: number): M3State | null {
  const i = m.log.findIndex((c) => activeAt(c, ip, t));
  if (i < 0) return null;
  return { ...m, log: m.log.map((c, j) => (j === i ? { ...c, on: t } : c)) };
}

/** Kamery wyłączone ręcznie bez końca w minucie `t` (manualOff, linia 1812). */
export function manualOff(m: M3State, t: number): CamLog[] {
  return offAt(m, t).filter((c) => c.on === null);
}

/** Obie kamery z trasy mają zadanie at dokładnie od startu okna (linia 1821). */
export function atReady(m: M3State): boolean {
  return M3_ROUTE.every((ip) => m.log.some((c) => c.ip === ip && c.src === 'at' && c.off === m.win.start));
}

/** Zadania at obu kamer z trasy obejmują całe okno `w`. */
export function atCovers(m: M3State, w: M3Window): boolean {
  return M3_ROUTE.every((ip) => m.log.some((c) => c.ip === ip && c.src === 'at'
    && c.off <= w.start && c.on !== null && c.on >= w.start + w.len));
}

/** Zadania at od minuty `from` przepadają (podsłuch padł). */
export function dropJobsFrom(m: M3State, from: number): { m: M3State; dropped: number } {
  const log = m.log.filter((c) => !(c.src === 'at' && c.off >= from));
  const dropped = m.log.length - log.length;
  return { m: dropped ? { ...m, log } : m, dropped };
}

/** Hooki poleceń cam/at/wait dla zlecenia L. */
export const M3_CAM_HOOKS: CamHooks = {
  max: CAM_MAX,
  isOff: (s, ip) => camIsOff(s.mission.m3, ip, s.t),
  off: (s, ip) => { const m = camOffAt(s.mission.m3, ip, s.t, 'man'); return m ? withM(s, m) : s; },
  on: (s, ip) => { const m = camOnAt(s.mission.m3, ip, s.t); return m ? withM(s, m) : s; },
  addJob: (s, j) => withM(s, { ...s.mission.m3, log: [...s.mission.m3.log, { ip: j.ip, off: j.off, on: j.off + j.min, src: 'at' }] }),
  jobs: (s) => s.mission.m3.log.filter((c) => c.src === 'at').map((c) => ({ ip: c.ip, off: c.off, min: (c.on ?? c.off) - c.off })),
  afterAt: (s) => (M3_ROUTE.every((ip) => s.mission.m3.log.some((c) => c.ip === ip && c.src === 'at')) ? [{ html: M3_AT_READY }] : []),
  lost: (s, from) => {
    const r = dropJobsFrom(s.mission.m3, from);
    return r.dropped > 0 ? step(withM(s, r.m), [{ html: M3_JOBS_LOST }]) : step(s);
  },
  after: (s) => m3Check(s),
};

/** cam/at/wait tylko w przyjętym zleceniu L.; przed przyjęciem (gdy L. jest jedyną ofertą) zwykłe „nie znaleziono”. */
export const M3_COMMANDS: CommandTable = Object.fromEntries(
  Object.entries(camCommands(M3_CAM_HOOKS)).map(([k, f]) => [k, (a: string[], s: GameState) => (s.active === 'm3' ? f(a, s) : notFound(s, k))]),
);

// ——— Ocena okna (makieta linie 1703–1746) ———

/** Nazwa kamery bez „kamera, p. 7, ” i „ (Hotel Luksus)” (linia 1724). */
export function camName(ip: string): string {
  const kto = M3_CAMS.find((n) => n.ip === ip)?.kto ?? ip;
  return kto.replace('kamera, p. 7, ', '').replace(' (Hotel Luksus)', '');
}

export type WindowJudgement = { res: 'ok' | 'early' | 'late'; early: string[]; miss: string[]; extra: boolean };

/** Ocena okna `m.win` (linie 1718–1722). */
export function judgeWindow(m: M3State): WindowJudgement {
  const { start, len } = m.win;
  const end = start + len;
  const miss = M3_ROUTE.filter((ip) => !m.log.some((c) => c.ip === ip && c.off <= start && (c.on === null || c.on >= end)));
  const early = M3_ROUTE.filter((ip) => m.log.some((c) => c.ip === ip && c.off < start - 1 && (c.on === null || c.on > start)));
  const extra = m.log.some((c) => !M3_ROUTE.includes(c.ip) && c.off < end && (c.on === null || c.on > start));
  return { res: early.length ? 'early' : miss.length ? 'late' : 'ok', early, miss, extra };
}

/** Wiadomość od L. w wątku m3; wątek znowu nieprzeczytany. */
export function m3MailL(s: GameState, html: string, when: number, bad?: boolean): GameState {
  const msg = { from: 'L.', when: gclk(s, when), html, ...(bad ? { bad: true } : {}) };
  return {
    ...s,
    mail: {
      ...s.mail,
      threads: { ...s.mail.threads, m3: [...(s.mail.threads.m3 ?? []), msg] },
      read: s.mail.read.filter((id) => id !== 'm3'),
    },
  };
}

/** Drugi błąd: mail, linia, zlecenie odwołane, rozłączenie z S1, porażka. */
export function m3Fail(s: GameState, mailHtml: string, when: number, line: string): StepResult {
  const mailed = m3MailL(s, mailHtml, when, true);
  const failed = withM(mailed, { ...mailed.mission.m3, fail: true });
  let r: StepResult = step(failed, [{ html: line }]);
  if (isLinkedToS1(failed)) r = andThen(r, leaveS1);
  return andThen(r, failMission);
}

/** Pokaz trasy na planie (linie 1768–1769). */
export function m3Walk(seenAt: string | null, rev: boolean): WalkSpec {
  const stopAt = !seenAt ? 1 : rev ? (seenAt === '10.42.5.33' ? 0.3 : 0.85) : (seenAt === '10.42.5.31' ? 0.18 : 0.62);
  return {
    path: (rev ? [...PLAN_ROUTE].reverse() : PLAN_ROUTE).map((p) => [p[0], p[1]] as [number, number]),
    stopAt,
    ms: 5200,
    holdMs: seenAt ? 1400 : 600,
  };
}

const names = (ips: string[]): string => ips.map(camName).join(' i ');
const many = (ips: string[]): boolean => ips.length > 1;

/** Tekst „za wcześnie” (linia 1728). */
export function m3EarlyText(early: string[]): string {
  return fill(M3_EARLY, {
    kamery: many(early) ? 'kamery' : 'kamera', nazwy: names(early),
    'nie_działają': many(early) ? 'nie działają' : 'nie działa',
  });
}

/** Tekst „za późno” (linia 1729); `back`: droga powrotna (plan 32). */
export function m3LateText(miss: string[], back: boolean): string {
  return fill(M3_LATE, {
    Kamery: many(miss) ? 'Kamery' : 'Kamera', nazwy: names(miss), 'działały': many(miss) ? 'działały' : 'działała',
    kiedy: back ? M3_LATE_BACK : M3_LATE_THERE,
  });
}

const live = (s: GameState): boolean => !s.failed && !s.mission.m3.fail && !s.mission.m3.ok;

/** Zasada 7 minut: obchód ochrony, kamera wraca, błąd (linie 1704–1711). */
export function m3Overflow(s: GameState): StepResult {
  const m = s.mission.m3;
  if (!live(s)) return step(s);
  const w0 = m.win;
  const isOver = (c: CamLog) => !c.caught && (c.on === null || c.on > c.off + CAM_MAX) && s.t >= c.off + CAM_MAX
    && (c.off + CAM_MAX < w0.start || m.evalAt === w0.start || s.t <= w0.start);
  const over = m.log.filter(isOver);
  if (!over.length) return step(s);
  const tc = Math.min(...over.map((c) => c.off + CAM_MAX));
  const ips = [...new Set(over.map((c) => c.ip))];
  const err = m.err + 1;
  const m2: M3State = {
    ...m,
    err,
    late: true,
    log: m.log.map((c) => (isOver(c) ? { ...c, caught: true, on: c.off + CAM_MAX } : c)),
  };
  const n = withM(s, m2);
  const txt = fill(M3_OVERFLOW, {
    kamery: many(ips) ? 'kamery' : 'kamera', nazwy: names(ips), 'działały': many(ips) ? 'działały' : 'działała',
    max: String(CAM_MAX), je: many(ips) ? 'je' : 'ją',
  });
  if (err >= 2) return m3Fail(n, txt + M3_OVERFLOW_FAIL, tc, fill(M3_FAIL_LINE, { txt }));
  return step(
    m3MailL(n, txt + M3_OVERFLOW_MAIL, tc, true),
    [{ html: fill(M3_OVERFLOW_LINE, { tc: gclk(s, tc), txt }) }],
    [{ kind: 'toast', text: M3_OVERFLOW_TOAST, bad: true }],
  );
}

/** Ocena okna minutę po starcie (linie 1717–1741): droga do 712. Plan 32 dokłada drogę powrotną. */
export function m3Evaluate(s: GameState): StepResult {
  const m = s.mission.m3;
  const w = m.win;
  if (!live(s) || m.leg !== 1 || s.t <= w.start || m.evalAt === w.start) return step(s);
  const j = judgeWindow(m);
  const end = w.start + w.len;
  const hm = hhmm(w.start);
  const show: UiEvent[] = [{ kind: 'open', app: 'plan' }, { kind: 'walk', ...m3Walk(j.res === 'late' ? j.miss[0] : null, false) }];
  let m2: M3State = { ...m, evalAt: w.start, extra: m.extra || j.extra };

  if (j.res === 'ok') {
    const exact = atCovers(m, w);
    m2 = {
      ...m2, wins: [...m.wins, { ...w }], leg: 2,
      notice: end + M3_NOTICE_AFTER, win: { start: end + M3_NOTICE_AFTER + M3_BACK_LEAD, len: 3 },
    };
    const g = gain(withM(s, m2), 'Skrypty', exact ? 0.5 : 0.2, exact ? 'zadanie at dokładnie na okno' : 'kamery wyłączone na czas');
    return step(
      m3MailL(g.state, fill(M3_THERE_MAIL, { hm }), end),
      [{ html: fill(M3_THERE_LINE, { hm }) }],
      [...show, ...g.ui, { kind: 'toast', text: M3_THERE_TOAST }],
    );
  }

  let txt: string;
  if (j.res === 'early') {
    m2 = { ...m2, log: m2.log.map((c) => (c.on === null || c.on > s.t ? { ...c, on: Math.max(c.off, s.t) } : c)) };
    txt = m3EarlyText(j.early);
  } else {
    txt = m3LateText(j.miss, false);
  }
  m2 = { ...m2, err: m.err + 1 };
  if (m2.err >= 2) {
    const r = m3Fail(withM(s, m2), txt + M3_WINDOW_FAIL, w.start, fill(M3_FAIL_LINE, { txt }));
    return { ...r, ui: [...show, ...r.ui] };
  }
  const early = j.res === 'early';
  m2 = { ...m2, late: m2.late || !early, win: { start: M3_RETRY_START, len: early ? 2 : 3 } };
  const mail = txt + (early ? '' : M3_RETRY_LATE) + (early ? M3_RETRY_EARLY : M3_RETRY_3);
  const lines: Line[] = [{ html: fill(M3_RETRY_LINE, { txt, len: String(m2.win.len) }) }];
  return step(
    m3MailL(withM(s, m2), mail, w.start, true),
    lines,
    [...show, { kind: 'toast', text: early ? M3_RETRY_TOAST_EARLY : M3_RETRY_TOAST_LATE, bad: true }],
  );
}

/** Straż zlecenia po każdym poleceniu i tiku: zadania at po padnięciu podsłuchu, 7 minut, ocena, 7 minut. */
export function m3Check(s: GameState): StepResult {
  if (s.active !== 'm3' || !live(s)) return step(s);
  let r: StepResult = step(s);
  if (!bugAtS1(s)) r = M3_CAM_HOOKS.lost(s, s.t);
  r = andThen(r, m3Overflow);
  r = andThen(r, m3Evaluate);
  return andThen(r, m3Overflow);
}
