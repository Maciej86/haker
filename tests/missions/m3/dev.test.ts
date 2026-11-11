import { expect, test } from 'vitest';
import { devJumps } from '../../../src/engine/dev';
import { stageIndex, termStep } from '../../../src/engine/missions';
import { initM3State } from '../../../src/missions/m3/state';
import '../../../src/missions';

const jump = (id: string) => devJumps().find(j => j.id === id)!;

test('skoki L. są w panelu dev', () => {
  expect(devJumps().map(j => [j.id, j.label])).toEqual(expect.arrayContaining([['m3-start', 'start L.'], ['m3-after-trip', 'L. po wyjeździe']]));
  expect(jump('m3-start').make()).toMatchObject({ day: 'czw', t: 830, money: 300, active: null, done: ['kuba'] });
});
test('L. po wyjeździe: podsłuch przy S1, etap 2', () => {
  const s = jump('m3-after-trip').make();
  expect(s).toMatchObject({ day: 'czw', t: 1050, money: 242, active: 'm3', screen: 'desktop' });
  expect(s.devices).toEqual([{ id: 'bug1', where: 'S1', minutes: 60 }]);
  expect(s.mail.threads.m3).toHaveLength(2);
  expect(s.mission.m3).toEqual(initM3State());
  expect(stageIndex(s)).toBe(2);
  expect(termStep(s)).toBe('połącz się z PODSŁUCH-1 (use S1)');
  expect(s.dayCheckpoint).toMatchObject({ t: 830, active: null });
  expect(jump('m3-after-trip').make()).not.toBe(s);
});
