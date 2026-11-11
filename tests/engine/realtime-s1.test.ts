import { test, expect, afterEach } from 'vitest';
import { realtimeTick, registerRealtime, clearRealtime } from '../../src/engine/realtime';
import { serialize, deserialize } from '../../src/engine/state';
import { afterKuba, atS1, linked } from './netHelpers';
afterEach(() => clearRealtime());

test('co 10 s: 1 min gry i 1 min urządzenia', () => {
  const s = linked(afterKuba([atS1(60)]));
  const r = realtimeTick(s, 10_000);
  expect(r.state.t).toBe(s.t + 1); expect(r.state.devices[0].minutes).toBe(59);
});
test('części sekund się sumują', () => {
  let s = linked(afterKuba([atS1(60)])); const t0 = s.t;
  s = realtimeTick(s, 6_000).state; expect(s.t).toBe(t0);
  s = realtimeTick(s, 6_000).state; expect(s.t).toBe(t0 + 1); expect(s.net.s1Ms).toBe(2_000);
  expect(deserialize(serialize(s))!.net.s1Ms).toBe(2_000);
});
test('bez połączenia albo przy overlayu nic nie leci', () => {
  const s = afterKuba([atS1(60)]);
  expect(realtimeTick(s, 60_000).state.t).toBe(s.t);
  const o = { ...linked(s), overlay: 'summary' as const };
  expect(realtimeTick(o, 60_000).state.t).toBe(o.t);
});
test('po porażce (failed) nic nie leci, nawet bez overlayu', () => {
  const s = { ...linked(afterKuba([atS1(60)])), failed: true };
  const r = realtimeTick(s, 60_000).state;
  expect([r.t, r.devices[0].minutes]).toEqual([s.t, 60]);
});
test('poza pulpitem nic nie leci', () => {
  const s = { ...linked(afterKuba([atS1(60)])), screen: 'trip' as const };
  expect(realtimeTick(s, 60_000).state.t).toBe(s.t);
});
test('źródło z pausesS1 wstrzymuje zużycie', () => {
  registerRealtime({ id: 'test-pause', pausesS1: true, active: st => st.money === 777, tick: (st) => ({ state: st, lines: [], ui: [] }) });
  const s = { ...linked(afterKuba([atS1(60)])), money: 777 };
  expect(realtimeTick(s, 30_000).state.devices[0].minutes).toBe(60);
});
test('przy zapasie 1 min: zerwanie po 10 s', () => {
  const r = realtimeTick(linked(afterKuba([atS1(1)])), 25_000);
  expect(r.state.devices[0].minutes).toBe(0);
  expect(r.state.terminal.location).toEqual({ kind: 'home' });
  expect(r.lines.map(l => l.html).join('\n')).toContain('PODSŁUCH-1 wyczerpany.');
});
