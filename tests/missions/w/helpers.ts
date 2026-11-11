// Wspólne pomocniki testów serwera banku (plan 21).
import type { GameState } from '../../../src/engine/types';
import type { SrvState } from '../../../src/engine/server';
import { wAfterTripState } from '../../../src/missions/w/dev';
import { run } from '../kuba/helpers';
import { runLine } from '../../../src/engine/terminal';
import { endCrack } from '../../../src/engine/server';
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
export const onBank = (p: Partial<SrvState> = {}): GameState => at(withSrv(endCrack(cracking(), 'ok').state, p), '/');
