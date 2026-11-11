import '../../../src/missions';
import { expect, test } from 'vitest';
import { createRealtimeLoop, holdsOnLoad, realtimeTick } from '../../../src/engine/realtime';
import { createStore } from '../../../src/engine/store';
import { deserialize, serialize } from '../../../src/engine/state';
import { m3Live } from '../../../src/missions/m3/live';
import { atBothAt, atT, cams, home, m3 } from './helpers';

test('na żywo od 21:10 do 21:14, nie wcześniej', () => {
  expect(m3Live(atT(cams(), 1269))).toBe(false);
  expect(m3Live(atT(cams(), 1270))).toBe(true);
  expect(m3Live(atT(cams(), 1274, 58))).toBe(true);
  expect(m3Live(atT(cams(), 1275))).toBe(false);
  expect(m3Live({ ...atT(cams(), 1271), active: null })).toBe(false);
});
test('1 min gry = 30 s; połączony podsłuch traci 1 min na minutę; s1 stoi', () => {
  let s = atT(cams(), 1270); const t0 = s.net.s1Ms;
  for (let i = 0; i < 15; i++) s = realtimeTick(s, 1000).state;
  expect([s.t, s.sec, s.devices[0].minutes]).toEqual([1270, 30, 51]);
  for (let i = 0; i < 15; i++) s = realtimeTick(s, 1000).state;
  expect([s.t, s.sec, s.devices[0].minutes, s.net.s1Ms]).toEqual([1271, 0, 50, t0]);
  const h = realtimeTick(atT(home(cams()), 1270, 58), 1000).state;
  expect([h.t, h.sec, h.devices[0].minutes]).toEqual([1271, 0, 51]);
  expect(realtimeTick(atT(cams(), 1270), 10_000).state.sec).toBe(20); // ?dev=1
});
test('poza minutami na żywo liczy s1 (10 s = 1 min)', () => {
  expect(realtimeTick(atT(cams(), 1200), 10_000).state.t).toBe(1201);
  expect(realtimeTick({ ...atT(cams(), 1271), overlay: 'summary' }, 1000).state.sec).toBe(0);
});
test('wejście w minuty na żywo z tiku s1: ten sam tik nie liczy drugi raz', () => {
  const s = atT(cams(), 1269);
  const r = realtimeTick({ ...s, net: { ...s.net, s1Ms: 9000 } }, 1000).state;
  expect([r.t, r.sec, r.devices[0].minutes]).toEqual([1270, 0, 50]);
});
test('z żywych minut prosto w ocenę', () => {
  let s = atT(home(atBothAt(cams())), 1274, 58);
  s = realtimeTick(s, 1000).state;
  expect([s.t, m3(s).leg]).toEqual([1275, 2]);
});
test('odświeżenie w minutach na żywo: pętla startuje w pauzie', () => {
  const s = deserialize(serialize(atT(cams(), 1271, 30)))!;
  expect([s.t, s.sec]).toEqual([1271, 30]);
  expect(holdsOnLoad(s)).toBe(true);
  expect(holdsOnLoad(atT(cams(), 1200))).toBe(false);
  const store = createStore(s); const loop = createRealtimeLoop(store, { speed: 1, isHidden: () => false, startPaused: holdsOnLoad(s) });
  expect(loop.paused()).toBe(true); loop.tick(1000); expect(store.get().sec).toBe(30);
  loop.resume(); loop.tick(1000); expect(store.get().sec).toBe(32);
});
