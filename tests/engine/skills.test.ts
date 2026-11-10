import { test, expect } from 'vitest';
import { gain, addXp, skillSummaryRows } from '../../src/engine/skills';
import { game } from './fixtures';

test('gain dodaje przyrost, zdarzenie i liczy się raz na powód', () => {
  const r = gain(game(), 'Linux', 0.2, 'pierwsze ls na cudzym serwerze');
  expect(r.state.skills.Linux).toBe(1.7);
  expect(r.ui).toEqual([{ kind: 'gain', sk: 'Linux', v: 0.2, why: 'pierwsze ls na cudzym serwerze' }]);
  const again = gain(r.state, 'Linux', 0.2, 'pierwsze ls na cudzym serwerze');
  expect(again.state).toBe(r.state); expect(again.ui).toEqual([]);
});
test('gain zaokrągla i nie przekracza 5', () => {
  expect(gain(game(), 'Sieć', 0.4, 'x').state.skills['Sieć']).toBe(2);
  let s = game(); for (let i = 0; i < 3; i++) s = gain(s, 'Skrypty', 0.1, 'p' + i).state;
  expect(s.skills.Skrypty).toBe(0.3);
  expect(gain(game({ skills: { ...game().skills, Social: 4.9 } }), 'Social', 0.3, 'y').state.skills.Social).toBe(5);
});
test('addXp przez kilka progów', () => {
  expect(addXp(game({ xp: 40, lvl: 1 }), 80)).toMatchObject({ xp: 120, lvl: 1 });
  expect(addXp(game({ xp: 120, lvl: 1 }), 80)).toMatchObject({ xp: 200, lvl: 2 });
  expect(addXp(game({ xp: 190, lvl: 1 }), 500)).toMatchObject({ xp: 690, lvl: 4 });
});
test('skillSummaryRows grupuje przyrosty z powodami', () => {
  const s = game({ skills: { 'Sieć': 2, 'Linux': 2, 'Skrypty': 0, 'Social': 1 }, gains: [
    { sk: 'Sieć', v: 0.4, why: 'hasło złamane za pierwszym razem' },
    { sk: 'Linux', v: 0.2, why: 'pierwsze ls na cudzym serwerze' },
    { sk: 'Linux', v: 0.3, why: 'pobranie i czyste rozłączenie' }] });
  expect(skillSummaryRows(s)).toEqual([
    { label: 'Umiejętności w tej misji', value: '', tone: 'dim' },
    { label: 'Sieć    ▮▮▯▯▯ +0,4', value: 'hasło złamane za pierwszym razem', tone: 'ok' },
    { label: 'Linux   ▮▮▯▯▯ +0,5', value: 'pierwsze ls na cudzym serwerze, pobranie i czyste rozłączenie', tone: 'ok' }]);
  expect(skillSummaryRows(game())).toEqual([]);
});
