import { test, expect, afterEach } from 'vitest';
import { finishMission, failMission, retryDay } from '../../src/engine/missions';
import { step } from '../../src/engine/types';
import type { GameState } from '../../src/engine/types';
import { game, withMission } from './fixtures';

let restore: (() => void) | undefined;
afterEach(() => { restore?.(); restore = undefined; });

const thu = (p: Partial<GameState> = {}) => game({ day: 'czw', t: 16 * 60, money: 300, xp: 120, lvl: 1,
  done: ['kuba'], active: 'w', mail: { ...game().mail, hidden: [] }, ...p });

test('W.: nagroda, premie, XP, podsumowanie', () => {
  restore = withMission('w', { bonuses: [
    { label: 'Zapas co najmniej 30 min przed terminem', money: 300, when: s => s.t <= 18 * 60 + 30 },
    { label: 'Rozłączony z serwerem przed wysłaniem', money: 100, when: () => false }] });
  const r = finishMission(thu(), 'w');
  expect(r.state).toMatchObject({ money: 3100, xp: 200, lvl: 2, done: ['kuba', 'w'], active: null, overlay: 'summary', failed: false });
  expect(r.state.summaryMeta).toEqual({ log: ['> Plik dostarczony: zestawienie oddziałów.', '> W. potwierdził odbiór.', '> Zlecenie zakończone.'],
    xp: 80, money: 2800, next: 'nextDay' });
  expect(r.state.summary!.slice(0, 4)).toEqual([
    { label: 'Nagroda za zlecenie', value: '2500 ¤', tone: 'ok' },
    { label: '✓ Zapas co najmniej 30 min przed terminem', value: '+300 ¤', tone: 'ok' },
    { label: '· Rozłączony z serwerem przed wysłaniem', value: '—' },
    { label: 'Odblokowano: motyw Bursztyn (Start → Motyw)', value: '', tone: 'ok' }]);
});
test('Kuba: 300 ¤, motyw Neon, premia bez pieniędzy jako „dobry nawyk”', () => {
  restore = withMission('kuba', { bonuses: [{ label: 'Rozłączony z serwerem przed wysłaniem', money: 0, note: 'dobry nawyk', when: () => true }] });
  const r = finishMission(game({ active: 'kuba' }), 'kuba');
  expect(r.state.money).toBe(400);
  expect(r.state.summary).toContainEqual({ label: '✓ Rozłączony z serwerem przed wysłaniem', value: 'dobry nawyk', tone: 'ok' });
  expect(r.state.summary).toContainEqual({ label: 'Odblokowano: motyw Neon (Start → Motyw)', value: '', tone: 'ok' });
  expect(r.state.summaryMeta!.next).toBe('nextDay');
});
test('ostatnia misja → koniec demo; adjustReward i onFinish działają', () => {
  restore = withMission('m3', {
    adjustReward: () => ({ money: 1500, label: 'Nagroda za zlecenie (pomniejszona: druga próba)' }),
    onFinish: s => step({ ...s, sec: 0 }, [{ html: 'hak' }]) });
  const r = finishMission(thu({ done: ['kuba', 'w'], active: 'm3', sec: 40 }), 'm3');
  expect(r.state.summaryMeta!.next).toBe('end');
  expect(r.state.summary![0]).toEqual({ label: 'Nagroda za zlecenie (pomniejszona: druga próba)', value: '1500 ¤', tone: 'ok' });
  expect(r.state.sec).toBe(0); expect(r.lines).toEqual([{ html: 'hak' }]);
});
test('failMission: brak nagrody, przycisk retry', () => {
  const s = thu({ t: 19 * 60 + 5 });
  const r = failMission(s);
  expect(r.state).toMatchObject({ failed: true, overlay: 'summary', money: 300, xp: 120, active: 'w' });
  expect(r.state.summaryMeta).toEqual({ log: ['> Plik dotarł po terminie.', '> Zlecenie nieudane.'], xp: 0, money: 0, next: 'retry' });
});
test('retryDay wraca do dayCheckpoint, a bez niego do nowej gry', () => {
  const { dayCheckpoint: _x, ...cp } = thu({ t: 830, active: null, money: 400 });
  const back = retryDay(thu({ t: 19 * 60 + 5, money: 250, failed: true, overlay: 'summary', dayCheckpoint: cp }));
  expect(back).toMatchObject({ t: 830, money: 400, failed: false, overlay: null, active: null });
  expect(back.dayCheckpoint).toEqual(cp);
  expect(retryDay(game({ seed: 9, day: 'pt' })).day).toBe('śr');
});
