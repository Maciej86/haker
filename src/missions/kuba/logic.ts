import { rng } from '../../engine/rng';
import type { BakeItem } from '../../engine/wytrych';
import type { Bake } from './state';

export function drawBake(seed: number): Bake {
  const R = rng(seed ^ 0x6b75);
  const r = () => 2 + Math.floor(R() * 5);
  for (;;) {
    const b: Bake = { chleb: r(), bulka: r(), rogal: r() };
    if (new Set([b.chleb, b.bulka, b.rogal]).size === 3 && b.rogal * b.bulka > b.chleb) return b;
  }
}

export const bakeAnswer = (b: Bake): number => b.rogal * b.bulka - b.chleb;

export function bakeRows(b: Bake): { items: BakeItem[]; result: number | null }[] {
  return [
    { items: ['chleb', '+', 'chleb', '+', 'chleb'], result: 3 * b.chleb },
    { items: ['chleb', '+', 'bulka'], result: b.chleb + b.bulka },
    { items: ['bulka', '+', 'bulka', '+', 'rogal'], result: 2 * b.bulka + b.rogal },
    { items: ['rogal', '×', 'bulka', '−', 'chleb'], result: null },
  ];
}

export function bakeHints(b: Bake): [string, string, string] {
  return [
    `Pierwsze równanie ma same chleby: 3 chleby to ${3 * b.chleb}, więc jeden chleb to ${b.chleb}.`,
    `Z drugiego: chleb (${b.chleb}) + bułka = ${b.chleb + b.bulka}, więc bułka to ${b.bulka}. Z trzeciego: ${b.bulka} + ${b.bulka} + rogal = ${2 * b.bulka + b.rogal}.`,
    `Rogal to ${b.rogal}. Ostatnie: ${b.rogal} × ${b.bulka} − ${b.chleb}.`,
  ];
}
