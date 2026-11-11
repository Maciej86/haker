import '../../src/missions';
import { expect, test } from 'vitest';
import { walkFrame } from '../../src/engine/walk';
import { m3Walk } from '../../src/missions/m3/window';
import { PLAN_ROUTE } from '../../src/missions/m3/plan';

const w = (stopAt = 1) => ({ path: [[300, 262], [300, 200], [300, 150], [548, 150], [548, 182]] as [number, number][], stopAt, ms: 5200, holdMs: stopAt < 1 ? 1400 : 600 });
test('kropka idzie trasą: połowa drogi w korytarzu B', () => {
  expect(walkFrame(w(), 0).dot).toEqual({ x: 300, y: 262, seen: false });
  expect(walkFrame(w(), 2600).dot).toEqual({ x: 384, y: 150, seen: false });   // 196 z 392
  expect(walkFrame(w(), 5200).dot).toEqual({ x: 548, y: 182, seen: false });
  expect(walkFrame(w(), 5800)).toEqual({ dot: null, done: true });
});
test('przy błędzie staje w polu widzenia i świeci', () => {
  const f = walkFrame(w(0.18), 1000).dot!;
  expect(f.x).toBe(300); expect(f.y).toBeCloseTo(191.44, 2); expect(f.seen).toBe(true);
  expect(walkFrame(w(0.18), 900).dot!.seen).toBe(false);
  expect(walkFrame(w(0.18), 2336).done).toBe(true);
  expect(m3Walk('10.42.5.33', true)).toMatchObject({ path: [...PLAN_ROUTE].reverse(), stopAt: 0.3 });
});
test('trasa z jednym punktem i ujemny czas nie psują klatki', () => {
  expect(walkFrame({ path: [[10, 20]], stopAt: 1, ms: 100, holdMs: 0 }, 50).dot).toEqual({ x: 10, y: 20, seen: false });
  expect(walkFrame(w(), -5).dot).toEqual({ x: 300, y: 262, seen: false });
});
