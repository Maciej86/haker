import { test, expect } from 'vitest';
import { devJumps, registerDevJump, devEnabled } from '../../src/engine/dev';
import { game } from './fixtures';

test('skok „misja 1” daje nową grę; rejestracja zastępuje po id', () => {
  expect(devJumps().map(j => [j.id, j.label])).toContainEqual(['kuba', 'misja 1']);
  expect(devJumps().find(j => j.id === 'kuba')!.make()).toMatchObject({ day: 'śr', t: 1230 });
  registerDevJump({ id: 'kuba', label: 'inna', make: () => game() });
  expect(devJumps().filter(j => j.id === 'kuba')).toHaveLength(1);
  expect(devEnabled('?dev=1')).toBe(true); expect(devEnabled('')).toBe(false);
});
