import { createContext, createElement, useContext, useMemo, useReducer, type ReactNode } from 'react';
import type { AppId } from '../engine/types';

export type Rect = { x: number; y: number; w: number; h: number };
export const BAR_H = 44;
export const MIN_W = 320;
export const MIN_H = 180;

export type WinState = { order: AppId[]; rects: Partial<Record<AppId, Rect>>; placed: AppId[] };
export const EMPTY_WINS: WinState = { order: [], rects: {}, placed: [] };

const top = (order: AppId[], app: AppId): AppId[] => [...order.filter((a) => a !== app), app];

export function openWin(ws: WinState, app: AppId, initial: Rect): WinState {
  return {
    order: top(ws.order, app),
    rects: { ...ws.rects, [app]: ws.rects[app] ?? initial },
    placed: ws.placed.includes(app) ? ws.placed : [...ws.placed, app],
  };
}
export const closeWin = (ws: WinState, app: AppId): WinState => ({ ...ws, order: ws.order.filter((a) => a !== app) });
export const focusWin = (ws: WinState, app: AppId): WinState =>
  ws.order.includes(app) ? { ...ws, order: top(ws.order, app) } : ws;

function patchRect(ws: WinState, app: AppId, f: (r: Rect) => Rect): WinState {
  const r = ws.rects[app];
  return r ? { ...ws, rects: { ...ws.rects, [app]: f(r) } } : ws;
}
export const moveWin = (ws: WinState, app: AppId, x: number, y: number): WinState =>
  patchRect(ws, app, (r) => ({ ...r, x: Math.max(0, x), y: Math.max(BAR_H, y) }));
export const resizeWin = (ws: WinState, app: AppId, w: number, h: number): WinState =>
  patchRect(ws, app, (r) => ({ ...r, w: Math.max(MIN_W, w), h: Math.max(MIN_H, h) }));
export const zIndex = (ws: WinState, app: AppId): number => 11 + ws.order.indexOf(app);
export const activeWin = (ws: WinState): AppId | null => ws.order[ws.order.length - 1] ?? null;

// Okno obok Terminala (misja.html linie 1427–1429).
export function place(term: Rect | null, vw: number, vh: number): Rect | null {
  if (!term) return null;
  const hud = vw > 1100 ? 262 : 16;
  const right = term.x + term.w;
  const free = vw - hud - (right + 12);
  if (free < 720) return null;
  return { x: right + 12, y: 58, w: Math.min(1100, free), h: vh - 58 - 56 };
}

type Action =
  | { t: 'open'; app: AppId; rectFor: RectFor }
  | { t: 'close' | 'focus'; app: AppId }
  | { t: 'move'; app: AppId; x: number; y: number }
  | { t: 'resize'; app: AppId; w: number; h: number }
  | { t: 'reset'; apps: AppId[]; rectFor: RectFor };

export type RectFor = (app: AppId, ws: WinState) => Rect;

function reduce(ws: WinState, a: Action): WinState {
  switch (a.t) {
    case 'open': return openWin(ws, a.app, ws.rects[a.app] ?? a.rectFor(a.app, ws));
    case 'close': return closeWin(ws, a.app);
    case 'focus': return focusWin(ws, a.app);
    case 'move': return moveWin(ws, a.app, a.x, a.y);
    case 'resize': return resizeWin(ws, a.app, a.w, a.h);
    case 'reset': return a.apps.reduce((w, app) => reduce(w, { t: 'open', app, rectFor: a.rectFor }), EMPTY_WINS);
  }
}

export type Windows = {
  order: AppId[];
  open(app: AppId): void;
  close(app: AppId): void;
  focus(app: AppId): void;
  isOpen(app: AppId): boolean;
  isActive(app: AppId): boolean;
  rect(app: AppId): Rect;
  zIndex(app: AppId): number;
  move(app: AppId, x: number, y: number): void;
  resize(app: AppId, w: number, h: number): void;
  reset(apps: AppId[]): void;
};

const Ctx = createContext<Windows | null>(null);
const FALLBACK: Rect = { x: 0, y: BAR_H, w: MIN_W, h: MIN_H };

export function WindowsProvider({ rectFor, children }: { rectFor: RectFor; children?: ReactNode }) {
  const [ws, dispatch] = useReducer(reduce, EMPTY_WINS);
  const value = useMemo<Windows>(() => ({
    order: ws.order,
    open: (app) => dispatch({ t: 'open', app, rectFor }),
    close: (app) => dispatch({ t: 'close', app }),
    focus: (app) => dispatch({ t: 'focus', app }),
    isOpen: (app) => ws.order.includes(app),
    isActive: (app) => activeWin(ws) === app,
    rect: (app) => ws.rects[app] ?? FALLBACK,
    zIndex: (app) => zIndex(ws, app),
    move: (app, x, y) => dispatch({ t: 'move', app, x, y }),
    resize: (app, w, h) => dispatch({ t: 'resize', app, w, h }),
    reset: (apps) => dispatch({ t: 'reset', apps, rectFor }),
  }), [ws, rectFor]);
  return createElement(Ctx.Provider, { value }, children);
}

export function useWindows(): Windows {
  const w = useContext(Ctx);
  if (!w) throw new Error('WindowsProvider: brak dostawcy');
  return w;
}
