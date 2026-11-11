import '../../../src/missions';
import { expect, test } from 'vitest';
import { devJumps } from '../../../src/engine/dev';
import { clockView, stageIndex } from '../../../src/engine/missions';
import { canDeliver } from '../../../src/engine/delivery';
import { m3Live } from '../../../src/missions/m3/live';
import { m3 } from './helpers';

const jump = (id: string) => devJumps().find(j => j.id === id)!.make();
test('L. wiadomość o wyjściu i L. raport', () => {
  const a = jump('m3-back');
  expect([a.t, m3(a).noticed, m3Live(a), a.terminal.location.kind, stageIndex(a)]).toEqual([1305, true, true, 'home', 5]);
  expect(clockView(a)!.note!.html).toBe('Wychodzi o 21:50. Połącz się: <code>use S1</code> (2 min).');
  const b = jump('m3-report');
  expect([b.t, m3(b).ok, m3(b).err, stageIndex(b), canDeliver(b, 'm3')]).toEqual([1311, true, 0, 6, true]);
  expect(devJumps().map(j => j.label)).toEqual(expect.arrayContaining(['L. wiadomość o wyjściu', 'L. raport']));
  expect(jump('m3-back')).not.toBe(a);
});
