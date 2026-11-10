import type { FC } from 'react';

type Slot = { id: string; c: FC };
const reg: Record<'bar' | 'desktop', Slot[]> = { bar: [], desktop: [] };

export function registerSlot(where: 'bar' | 'desktop', id: string, c: FC): void {
  const list = reg[where];
  const i = list.findIndex((x) => x.id === id);
  if (i >= 0) list[i] = { id, c }; else list.push({ id, c });
}

export function slots(where: 'bar' | 'desktop'): { id: string; c: FC }[] {
  return [...reg[where]];
}
