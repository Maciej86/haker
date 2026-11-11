// Sesja na serwerze z folderami (plan 21): namierzanie, zerwanie, auth.log.
// Fikcyjna gra: „serwer”, „namierzanie” i „włamanie” to dane i reguły łamigłówki w pamięci.
import type { GameState, StepResult } from './types';
import { andThen, step } from './types';
import { gclk } from './clock';
import { focusMission, missionDef, missionHost } from './missions';
import type { HostDef } from './missions';
import { spend } from './devices';

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
