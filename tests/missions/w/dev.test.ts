import { expect, test } from 'vitest';
import { devJumps } from '../../../src/engine/dev';
import { stageIndex, termStep } from '../../../src/engine/missions';
import { MISSIONS } from '../../../src/missions';
import { SAMPLE_TRIP } from '../../../src/world/trip/sample';

const jump = (id: string) => devJumps().find(j => j.id === id)!;

test('skoki W. są w panelu dev', () => {
  expect(devJumps().map(j => [j.id, j.label])).toEqual(expect.arrayContaining([['w-start', 'start W.'], ['w-after-trip', 'W. po wyjeździe']]));
  expect(jump('w-start').make()).toMatchObject({ day: 'czw', t: 830, money: 300, active: null });
});
test('W. po wyjeździe: podsłuch przy S1, etap 3', () => {
  const s = jump('w-after-trip').make();
  expect(s).toMatchObject({ day: 'czw', t: 965, money: 242, active: 'w', screen: 'desktop' });
  expect(s.devices).toEqual([{ id: 'bug1', where: 'S1', minutes: 60 }]);
  expect(s.mail.threads.w).toHaveLength(2);
  expect(s.mission.w).toMatchObject({ found: false });
  expect(s.net.reusedBug).toBe(false);
  expect(stageIndex(s)).toBe(3);
  expect(termStep(s)).toBe('połącz się z PODSŁUCH-1 (use S1)');
  expect(s.dayCheckpoint).toMatchObject({ t: 830, active: null });
  expect(jump('w-after-trip').make()).not.toBe(s);
});
test('skok trip-sample nie podmienia już wyjazdu W.', () => {
  const before = MISSIONS.w.trip;
  jump('trip-sample').make();
  expect(MISSIONS.w.trip).toBe(before);
  expect(MISSIONS.w.trip).not.toBe(SAMPLE_TRIP);
  expect(MISSIONS.w.trip).toEqual(SAMPLE_TRIP);
});
