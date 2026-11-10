import type { GameState, Skill, StepResult, SummaryRow } from './types';
import { step } from './types';
import { fmtSkill } from './text';

/** Maksymalny poziom umiejętności. */
export const SKILL_MAX = 5;

/** XP potrzebne do przejścia z poziomu `lvl` na następny. */
export function xpNeed(lvl: number): number {
  return lvl * 200;
}

export function gain(s: GameState, sk: Skill, v: number, why: string): StepResult {
  if (s.gains.some((g) => g.sk === sk && g.why === why)) return step(s);
  const next: GameState = {
    ...s,
    skills: { ...s.skills, [sk]: Math.min(SKILL_MAX, +(s.skills[sk] + v).toFixed(2)) },
    gains: [...s.gains, { sk, v, why }],
  };
  return step(next, [], [{ kind: 'gain', sk, v, why }]);
}

export function addXp(s: GameState, n: number): GameState {
  let xp = s.xp + n;
  let lvl = s.lvl;
  while (xp >= xpNeed(lvl)) lvl++;
  return { ...s, xp, lvl };
}

export function skillSummaryRows(s: GameState): SummaryRow[] {
  if (s.gains.length === 0) return [];
  const order: Skill[] = [];
  const sum = new Map<Skill, number>();
  const why = new Map<Skill, string[]>();
  for (const g of s.gains) {
    if (!sum.has(g.sk)) { order.push(g.sk); sum.set(g.sk, 0); why.set(g.sk, []); }
    sum.set(g.sk, sum.get(g.sk)! + g.v);
    why.get(g.sk)!.push(g.why);
  }
  const rows: SummaryRow[] = [{ label: 'Umiejętności w tej misji', value: '', tone: 'dim' }];
  for (const sk of order) {
    const lv = Math.max(0, Math.min(5, Math.floor(s.skills[sk])));
    rows.push({
      label: `${sk.padEnd(7, ' ')} ${'▮'.repeat(lv)}${'▯'.repeat(5 - lv)} +${fmtSkill(sum.get(sk)!)}`,
      value: why.get(sk)!.join(', '),
      tone: 'ok',
    });
  }
  return rows;
}
