// Sesja na serwerze z folderami (plan 21): namierzanie, zerwanie, auth.log.
// Fikcyjna gra: „serwer”, „namierzanie” i „włamanie” to dane i reguły łamigłówki w pamięci.
import type { GameState, StepResult } from './types';
import { andThen, step } from './types';
import { gclk } from './clock';
import { focusMission, missionDef, missionHost } from './missions';
import type { HostDef } from './missions';
import { bug, bugAtS1, s1Minutes, spend } from './devices';
import { isLinkedToS1 } from './commands/basic';
import { gain } from './skills';
import type { RealtimeSource } from './realtime';
import { ROT, genBoard, powered } from './wires';

export type LogLine = { id: number; t: string; me?: boolean };
export type CrackState = { board: number[][]; sol: number[][]; inRow: number; outRow: number; moves: number; ms: number };
export type SrvState = {
  trace: number;                       // 0..100, liczba zmiennoprzecinkowa
  alert: boolean;                      // czujny bank: koszty i tempo ×1,25
  caught: boolean;                     // choć raz namierzony
  cracked: boolean;                    // choć raz wszedł na serwer
  tries: number;                       // próby Wytrycha (ziarno planszy)
  crack: CrackState | null;            // Wytrych w toku
  res: 'ok' | 'caught' | 'abort' | null; // wynik ostatniej próby
  dl: { path: string; ms: number; secs: number } | null; // pobieranie w toku
  lastCmd: { cmd: string; v: number | null } | null;    // pasek stanu mc
  seen: string[]; known: string[];     // odwiedzone katalogi, pliki po info/cat
  mc: { open: boolean; preview: string | null };
  editor: { work: LogLine[]; dirty: boolean; fromMc: boolean } | null;
  log: LogLine[]; logSeq: number; logClean: boolean; logBad: boolean;
};

export function initSrvState(): SrvState {
  return {
    trace: 0, alert: false, caught: false, cracked: false, tries: 0,
    crack: null, res: null, dl: null, lastCmd: null,
    seen: ['/'], known: [],
    mc: { open: false, preview: null },
    editor: null,
    log: [], logSeq: 0, logClean: false, logBad: false,
  };
}

export const withSrv = (s: GameState, p: Partial<SrvState>): GameState => ({ ...s, srv: { ...s.srv, ...p } });

/** Gracz jest na hoście z drzewem plików, połączony przez S1. */
export function onServer(s: GameState): boolean {
  const l = s.terminal.location;
  return l.kind === 'host' && l.via === 'S1' && !!missionHost(s, l.ip)?.tree;
}

/** Host, na którym gracz teraz jest (tylko host z drzewem). */
export function srvHost(s: GameState): HostDef | null {
  const l = s.terminal.location;
  return onServer(s) && l.kind === 'host' ? missionHost(s, l.ip)! : null;
}

/** Host z drzewem misji w fokusie (Wytrych i zerwanie działają też poza serwerem). */
export function treeHost(s: GameState): HostDef | null {
  return srvHost(s) ?? missionDef(focusMission(s))?.hosts?.find((h) => !!h.tree) ?? null;
}

/** Tempo namierzania w %/s: 0,7 × (czujny ? 1,25 : 1) × 2 / log2(łącze + 2). */
export function traceRate(s: GameState): number {
  return 0.7 * (s.srv.alert ? 1.25 : 1) * 2 / Math.log2(s.hw.net + 2);
}

/** Wiersz gracza w auth.log z adresu PODSŁUCHU-1 (linia 1273). */
export function logMe(s: GameState, what: string): GameState {
  const line: LogLine = { id: s.srv.logSeq, t: `${gclk(s).padEnd(9)}  ???           10.42.0.250  ${what}`, me: true };
  return withSrv(s, { log: [...s.srv.log, line], logSeq: s.srv.logSeq + 1, logClean: false });
}

/** Koszt polecenia na serwerze: skok namierzania (czujny bank ×1,25, do 0,1). Przy 100% zerwanie. */
export function charge(s: GameState, v: number, cmd: string): { r: StepResult; caught: boolean } {
  const cost = Math.round(v * (s.srv.alert ? 1.25 : 1) * 10) / 10;
  const n = withSrv(s, { trace: Math.min(100, s.srv.trace + cost), lastCmd: { cmd, v: cost } });
  if (n.srv.trace >= 100) return { r: caughtOnServer(n), caught: true };
  return { r: step(n), caught: false };
}

/** Namierzony na serwerze: zerwanie, powrót na S1, −15 min gry, −5 min urządzenia (linie 1254–1258). */
export function caughtOnServer(s: GameState): StepResult {
  const ip = treeHost(s)?.ip ?? '';
  let n = logMe(withSrv(s, { dl: null, crack: null, mc: { ...s.srv.mc, open: false }, editor: null }), 'nieudane logowanie');
  n = withSrv(n, { caught: true, alert: true });
  n = { ...n, terminal: { ...n.terminal, location: { kind: 'S1' } } };
  const r = step(n, [{
    // linia 1257 bez porady „Powrót: crack …, potem znowu do katalogu.” (Terminal nie podpowiada)
    html: `<span class="r">Namierzono cię przy 100%. Połączenie z ${ip} zerwane.</span> <span class="d">−15 min gry, −5 min urządzenia. Bank czujniejszy.</span>`,
  }], [
    { kind: 'toast', text: 'Namierzono cię na serwerze! Połączenie zerwane.', bad: true },
    { kind: 'stopTimer', timer: 'download' },
  ]);
  return andThen(r, (x) => spend(x, 15, 5));
}

const live = (s: GameState): boolean => s.screen === 'desktop' && s.overlay === null;
const at = (s: GameState, location: GameState['terminal']['location']): GameState =>
  ({ ...s, terminal: { ...s.terminal, location } });

/** `crack <ip>` na hoście z drzewem: nowa plansza Wytrycha, 5 min gry i 2 min urządzenia (linie 925–931, 1178–1186). */
export function startCrack(s: GameState, ip: string): StepResult {
  if (onServer(s)) return step(s, [{ html: `<span class="d">Jesteś już na ${ip}.</span>` }]);
  // linia 929 bez „Okno Wytrych.” (Terminal nie podpowiada); okno otwiera się samo
  if (s.srv.crack) return step(s, [{ html: '<span class="d">Włamanie trwa.</span>' }], [{ kind: 'open', app: 'wytrych' }]);
  if (!isLinkedToS1(s)) return step(s, [{ html: '<span class="r">Brak połączenia.</span>' }]);
  if ((bug(s)?.minutes ?? 0) < 3) return step(s, [{ html: '<span class="r">Za mało czasu pracy urządzenia na włamanie.</span>' }]);
  const tries = s.srv.tries + 1;
  const b = genBoard(s.seed + tries * 7919);
  const n = withSrv(s, { tries, trace: 0, res: null, crack: { ...b, moves: 0, ms: 0 } });
  const r = step(n, [
    { html: `<span class="d">Wytrych 1.0 · cel ${ip} · zabezpieczenie: bramka sieciowa, tryb przewodów · próba ${tries} (5 min gry, 2 min urządzenia na start)</span>` },
    { html: '<span class="r">Namierzanie ruszyło.</span>' },
  ], [{ kind: 'open', app: 'wytrych' }, { kind: 'startTimer', timer: 'crackTrace' }]);
  return andThen(r, (x) => spend(x, 5, 2));
}

/** Obrót kafelka (dir 1 w prawo, 3 w lewo): +1% namierzania bez mnożnika czujności. */
export function turnTile(s: GameState, r: number, c: number, dir: 1 | 3): StepResult {
  const cr = s.srv.crack;
  if (!cr || cr.board[r]?.[c] === undefined) return step(s);
  const board = cr.board.map((row, i) => row.map((m, j) => {
    if (i !== r || j !== c) return m;
    let x = m;
    for (let k = 0; k < dir; k++) x = ROT(x);
    return x;
  }));
  const n = withSrv(s, { trace: Math.min(100, s.srv.trace + 1), crack: { ...cr, board, moves: cr.moves + 1 } });
  if (n.srv.trace >= 100) return endCrack(n, 'caught');
  if (powered(board, cr.inRow, cr.outRow).win) return endCrack(n, 'ok');
  return step(n);
}

/** Koniec próby Wytrycha (linie 1187–1195). */
export function endCrack(s: GameState, res: 'ok' | 'caught' | 'abort'): StepResult {
  const cr = s.srv.crack;
  if (!cr) return step(s);
  const host = treeHost(s);
  const ip = host?.ip ?? '';
  const n = withSrv(s, { crack: null, res });
  const stop = { kind: 'stopTimer', timer: 'crackTrace' } as const;
  if (res === 'ok') {
    const alert = s.srv.alert;
    let r = s.srv.cracked
      ? step(n)
      : gain(n, 'Sieć', alert ? 0.3 : 0.5, alert ? 'włamanie, z namierzeniem po drodze' : 'włamanie bez namierzenia');
    const x = at(withSrv(logMe(r.state, 'dostęp do serwera plików'), { cracked: true, seen: ['/'] }),
      { kind: 'host', ip, path: '/', via: 'S1' });
    r = step(x, [
      { html: `<span class="c">Dostęp uzyskany: ${ip} · ${host?.name ?? ''}.</span> <span class="d">${cr.moves} obrotów, ${Math.floor(cr.ms / 1000)} s.</span>` },
      // linia 1190 bez „Pliki: mc (albo cd, ls, info).” (Terminal nie podpowiada)
      { html: `<span class="y">Namierzanie wstrzymane na ${Math.round(s.srv.trace)}%. Każde polecenie na serwerze je podnosi.</span>` },
    ], [...r.ui, stop, { kind: 'toast', text: 'Dostęp uzyskany · krok „Włamanie” zaliczony' }]);
    return r;
  }
  if (res === 'caught') {
    const x = withSrv(logMe(n, 'nieudane logowanie (Wytrych)'), { alert: true, caught: true });
    const r = step(x, [{
      html: `<span class="r">Namierzono cię przy 100%. Połączenie z ${ip} zerwane.</span> <span class="d">−15 min gry, −5 min urządzenia. Bank czujniejszy.</span>`,
    }], [stop, { kind: 'toast', text: 'Namierzono cię! Połączenie zerwane.', bad: true }]);
    return andThen(r, (y) => spend(y, 15, 5));
  }
  return step(n, [{ html: '<span class="d">Przerwano włamanie. Namierzanie opada.</span>' }], [stop]);
}

/** Wytrych w toku: namierzanie rośnie w czasie rzeczywistym; minuty gry i urządzenia liczy samo (s1 stoi). */
export const CRACK_SOURCE: RealtimeSource = {
  id: 'crack',
  pausesS1: true,
  active: (s) => live(s) && s.srv.crack !== null,
  tick: (s, ms) => {
    const cr = s.srv.crack!;
    const r = s1Minutes(withSrv(s, { crack: { ...cr, ms: cr.ms + ms } }), ms);
    if (!bugAtS1(r.state)) return { ...r, state: withSrv(r.state, { crack: null, res: null }) };
    return andThen(r, (x) => {
      const n = withSrv(x, { trace: Math.min(100, x.srv.trace + traceRate(x) * ms / 1000) });
      return n.srv.trace >= 100 ? endCrack(n, 'caught') : step(n);
    });
  },
};

/** Po wyjściu z serwera albo przerwaniu namierzanie opada 40 %/s. */
export const TRACE_FALL_SOURCE: RealtimeSource = {
  id: 'trace-fall',
  active: (s) => live(s) && s.srv.trace > 0 && !s.srv.crack && !s.srv.dl && !onServer(s),
  tick: (s, ms) => step(withSrv(s, { trace: Math.max(0, s.srv.trace - 40 * ms / 1000) })),
};
