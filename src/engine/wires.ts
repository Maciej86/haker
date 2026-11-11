// Plansza Wytrycha w trybie przewodów (misja.html 1128–1151). Czyste funkcje, losowość tylko z ziarna.
import type { GameState } from './types';
import { rng } from './rng';
import type { SrvState } from './server';
import { traceRate, treeHost } from './server';

const R = 5;
const K = 7;
/** Otwory w kafelku: N=1 E=2 S=4 W=8; obrót w prawo przesuwa bity. */
export const ROT = (m: number): number => ((m << 1) | (m >> 3)) & 15;
/** [bit, dr, dc, przeciwny bit]. */
const DIRS: [number, number, number, number][] = [[1, -1, 0, 4], [2, 0, 1, 8], [4, 1, 0, 1], [8, 0, -1, 2]];
/** Prosty, kolanko, trójnik. */
const TILES = [5, 3, 7];

export type Board = { board: number[][]; sol: number[][]; inRow: number; outRow: number };

/** Kafelki zasilone od wejścia (lewa krawędź, `inRow`) i czy prąd dochodzi do wyjścia (prawa krawędź, `outRow`). */
export function powered(board: number[][], inRow: number, outRow: number): { set: string[]; win: boolean } {
  const set = new Set<string>();
  if (!board.length) return { set: [], win: false };
  const q: [number, number][] = [];
  if (board[inRow][0] & 8) { q.push([inRow, 0]); set.add(`${inRow},0`); }
  let win = false;
  while (q.length) {
    const [r, c] = q.shift()!;
    if (r === outRow && c === K - 1 && (board[r][c] & 2)) win = true;
    for (const [b, dr, dc, o] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (!(board[r][c] & b) || nr < 0 || nc < 0 || nr >= R || nc >= K) continue;
      if ((board[nr][nc] & o) && !set.has(`${nr},${nc}`)) { set.add(`${nr},${nc}`); q.push([nr, nc]); }
    }
  }
  return { set: [...set], win };
}

function genOnce(rand: () => number): Board {
  const g = Array.from({ length: R }, () => Array<number>(K).fill(0));
  let r = Math.floor(rand() * R);
  const inRow = r;
  g[r][0] |= 8;
  for (let c = 0; c < K; c++) {
    const tr = c === K - 1 ? Math.floor(rand() * R) : Math.max(0, Math.min(R - 1, r + Math.floor(rand() * 5) - 2));
    while (r !== tr) {
      const d = tr > r ? 1 : -1;
      g[r][c] |= d > 0 ? 4 : 1;
      r += d;
      g[r][c] |= d > 0 ? 1 : 4;
    }
    g[r][c] |= 2;
    if (c < K - 1) g[r][c + 1] |= 8;
  }
  const sol = g.map((row) => row.slice());
  for (let i = 0; i < R; i++) {
    for (let j = 0; j < K; j++) {
      if (!g[i][j]) { g[i][j] = TILES[Math.floor(rand() * 3)]; sol[i][j] = g[i][j]; }
      const n = Math.floor(rand() * 4);
      for (let k = 0; k < n; k++) g[i][j] = ROT(g[i][j]);
    }
  }
  return { board: g, sol, inRow, outRow: r };
}

/** Nowa plansza 5 × 7 z ziarna; plansza rozwiązana od razu → losuj dalej z tego samego generatora. */
export function genBoard(seed: number): Board {
  const rand = rng(seed);
  for (;;) {
    const b = genOnce(rand);
    if (!powered(b.board, b.inRow, b.outRow).win) return b;
  }
}

export type WiresView = {
  target: string;
  board: number[][];
  lit: string[];
  inRow: number;
  outRow: number;
  on: boolean;
  res: SrvState['res'];
  trace: number;
  rate: number;
  net: number;
  alert: boolean;
  moves: number;
  sec: number;
};

/** Dane okna Wytrych (tryb przewodów) dla UI. */
export function wiresView(s: GameState): WiresView {
  const c = s.srv.crack;
  const board = c?.board ?? [];
  return {
    target: treeHost(s)?.ip ?? '',
    board,
    lit: c ? powered(board, c.inRow, c.outRow).set : [],
    inRow: c?.inRow ?? 0,
    outRow: c?.outRow ?? 0,
    on: c !== null,
    res: s.srv.res,
    trace: s.srv.trace,
    rate: traceRate(s),
    net: s.hw.net,
    alert: s.srv.alert,
    moves: c?.moves ?? 0,
    sec: c ? Math.floor(c.ms / 1000) : 0,
  };
}
