import { test, expect } from 'vitest';
import '../../src/world/dev';
import { devJumps } from '../../src/engine/dev';
import { isLinkedToS1 } from '../../src/engine/commands/basic';
import { bugAtS1, useDevice } from '../../src/engine/devices';
const jump = (id: string) => devJumps().find(j => j.id === id)!;

test('bug-low: W. po wyjeździe, przy S1, 2 min zapasu', () => {
  expect(jump('bug-low').label).toBe('mało czasu urządzenia');
  const s = jump('bug-low').make();
  expect(s.active).toBe('w'); expect(isLinkedToS1(s)).toBe(true);
  expect(s.devices).toEqual([{ id: 'bug1', where: 'S1', minutes: 2 }]);
  expect(useDevice(s, 2).state.terminal.location).toEqual({ kind: 'home' });
});
test('bug-dead: zapas 0 przy S1, bez połączenia', () => {
  expect(jump('bug-dead').label).toBe('urządzenie wyczerpane');
  const s = jump('bug-dead').make();
  expect(s.active).toBe('w'); expect(bugAtS1(s)).toBe(false); expect(isLinkedToS1(s)).toBe(false);
  expect(s.devices).toEqual([{ id: 'bug1', where: 'S1', minutes: 0 }]);
});
