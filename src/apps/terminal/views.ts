import type { FC } from 'react';
import type { GameState } from '../../engine/types';

export type TerminalView = { id: string; active: (s: GameState) => boolean; component: FC };

const views: TerminalView[] = [];

export function registerTerminalView(v: TerminalView): void {
  const i = views.findIndex((x) => x.id === v.id);
  if (i >= 0) views[i] = v; else views.push(v);
}

export function activeTerminalView(s: GameState): TerminalView | null {
  return views.find((v) => v.active(s)) ?? null;
}
