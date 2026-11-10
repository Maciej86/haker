import type { FC } from 'react';
import type { WytrychView } from '../../engine/wytrych';
import { BakePanel } from './BakePanel';

type Mode = Exclude<WytrychView['mode'], 'none'>;

/** Rejestr trybów okna Wytrych: tryb z widoku silnika → panel. Plan 21 dopisze `wires`. */
export const WYTRYCH_MODES: { [M in Mode]?: FC<{ view: Extract<WytrychView, { mode: M }> }> } = {
  bake: BakePanel,
};
