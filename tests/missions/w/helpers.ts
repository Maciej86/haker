// Wspólne pomocniki testów serwera banku (plan 21).
import type { GameState, StepResult } from '../../../src/engine/types';
import { realtimeTick } from '../../../src/engine/realtime';
import { deliver } from '../../../src/engine/delivery';
import { editorAct } from '../../../src/engine/mc';
import type { SrvState } from '../../../src/engine/server';
import { wAfterTripState, wOnServerState } from '../../../src/missions/w/dev';
import { run } from '../kuba/helpers';
import { runLine } from '../../../src/engine/terminal';
import '../../../src/missions';

export { run, txt } from '../kuba/helpers';

export const BANK_IP = '10.42.7.12';

export const withSrv = (s: GameState, p: Partial<SrvState>): GameState => ({ ...s, srv: { ...s.srv, ...p } });

/** Lokacja na serwerze banku pod `path` (bez sprawdzania włamania; do testów kosztów i zerwania). */
export const at = (s: GameState, path: string): GameState => ({
  ...s,
  terminal: { ...s.terminal, location: { kind: 'host', ip: BANK_IP, path, via: 'S1' } },
});

/** Cel znaleziony: czw 16:16, zapas 54, lokacja S1. */
export const found = (): GameState => run(wAfterTripState(), 'use S1', 'scan', 'probe 10.42.7.12').state;

/** Wytrych w toku: czw 16:21, zapas 52. */
export const cracking = (): GameState => runLine(found(), 'crack 10.42.7.12').state;

/** Na serwerze banku w '/', po udanym Wytrychu; `p` łata `srv`. */
export const onBank = (p: Partial<SrvState> = {}): GameState => at(withSrv(wOnServerState(), p), '/');

// Plan 22: pomocniki zakończenia zlecenia.
export const V2 = 'zestawienie_oddzialow_2026_v2.xlsx';

/** Właściwy plik w Pobranych, gracz nadal na serwerze (w /finanse/zestawienia/2026). */
export const gotV2 = (s: GameState = onBank()): GameState =>
  realtimeTick(runLine(at(s, '/finanse/zestawienia/2026'), `get ${V2}`).state, 10_000).state;

/** Zejście z serwera i z S1 (dwa razy disconnect). */
export const home = (s: GameState): GameState => run(s, 'disconnect', 'disconnect').state;

/** Wysłanie V2 W. w Poczcie. */
export const sendV2 = (s: GameState): StepResult => deliver(s, 'w', 'W załączniku zestawienie.', `${BANK_IP}:${V2}`);

/** Edytor auth.log w /it/logi: usuwa własne wiersze, zapisuje i wychodzi; gracz zostaje na serwerze. */
export function cleanLog(s: GameState): GameState {
  let n = runLine(at(s, '/it/logi'), 'edit auth.log').state;
  for (let i = n.srv.editor!.work.findIndex((l) => l.me); i >= 0; i = n.srv.editor!.work.findIndex((l) => l.me)) {
    n = editorAct(n, { kind: 'del', index: i }).state;
  }
  n = editorAct(n, { kind: 'save' }).state;
  return editorAct(n, { kind: 'quit' }).state;
}
