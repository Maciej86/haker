import { expect, it } from 'vitest';
import { ACHIEVEMENTS, achievementView, checkAchievements } from '../../src/engine/achievements';
import type { Profile } from '../../src/engine/profile';
import type { MissionId } from '../../src/engine/types';
import { game } from './fixtures';

const P = (a: string[] = []): Profile => ({ themes: ['fosfor'], achievements: a });
it('kolejność z makiety', () => {
  expect(ACHIEVEMENTS.map(a => a.title)).toEqual(['Pierwszy dostęp', 'Człowiek sieci', 'Zakupoholik', 'Pierwsze zlecenie', 'Mistrz terminala']);
});
it('Człowiek sieci liczy skany', () => {
  const v = (n: number) => achievementView(game({ stats: { ...game().stats, scans: n } }), P()).find(a => a.id === 'scans')!;
  expect(v(0)).toMatchObject({ done: false, progress: [0, 5], status: '0/5' });
  expect(v(7)).toMatchObject({ done: true, progress: null, status: '✓' });
});
it('Mistrz terminala po trzech misjach', () => {
  const a = (done: MissionId[]) => achievementView(game({ done }), P()).find(x => x.id === 'all')!;
  expect(a(['kuba'])).toMatchObject({ done: false, locked: true, status: '' });
  expect(a(['kuba', 'w', 'm3'])).toMatchObject({ done: true, locked: false, status: '✓' });
});
it('osiągnięcie z profilu zostaje po nowej grze', () => {
  expect(achievementView(game(), P(['kuba'])).find(a => a.id === 'kuba')!.done).toBe(true);
});
it('checkAchievements: tylko nowe', () => {
  const s = game({ stats: { ...game().stats, first: true } });
  expect(checkAchievements(s, P())).toEqual(['first']); expect(checkAchievements(s, P(['first']))).toEqual([]);
});
