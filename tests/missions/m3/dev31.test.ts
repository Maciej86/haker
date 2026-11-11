import '../../../src/missions';
import { expect, test } from 'vitest';
import { devJumps } from '../../../src/engine/dev';
import { clockView, stageIndex } from '../../../src/engine/missions';
import { m3Live } from '../../../src/missions/m3/live';

const jump = (id: string) => devJumps().find(j => j.id === id)!.make();
test('L. przed oknem i L. minuty na żywo', () => {
  const a = jump('m3-before-window');
  expect([a.t, a.devices[0].minutes, a.terminal.location.kind, stageIndex(a)]).toEqual([1067, 51, 'home', 4]);
  expect(clockView(a)!.jump).toBe('⏩ Przewiń do 21:10');
  const b = jump('m3-live');
  expect([b.t, b.terminal.location.kind, m3Live(b)]).toEqual([1272, 'S1', true]);
  expect(b.mission.m3.log).toEqual([]);
  expect(devJumps().map(j => j.label)).toEqual(expect.arrayContaining(['L. przed oknem', 'L. minuty na żywo']));
});
