import { test, expect } from 'vitest';
import { rng, randInt } from '../../src/engine/rng';
test('rng jest deterministyczny i w [0,1)', () => {
  const a = rng(42), b = rng(42);
  const xs = Array.from({ length: 100 }, () => a());
  expect(Array.from({ length: 100 }, () => b())).toEqual(xs);
  expect(xs.every(x => x >= 0 && x < 1)).toBe(true);
  expect(rng(43)()).not.toBe(rng(42)());
});
test('randInt mieści się w przedziale i trafia oba końce', () => {
  const r = rng(7); const seen = new Set<number>();
  for (let i = 0; i < 500; i++) seen.add(randInt(r, 2, 6));
  expect([...seen].sort()).toEqual([2, 3, 4, 5, 6]);
});
