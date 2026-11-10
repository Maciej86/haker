import { test, expect, beforeEach, afterEach } from 'vitest';
import { registerRealtime, clearRealtime, realtimeTick, realtimeSpeed, createRealtimeLoop } from '../../src/engine/realtime';
import { createStore } from '../../src/engine/store';
import { advance } from '../../src/engine/clock';
import { step } from '../../src/engine/types';
import { game, memStorage, withMission } from './fixtures';

let restore: (() => void) | undefined;
beforeEach(() => clearRealtime());
afterEach(() => { restore?.(); restore = undefined; clearRealtime(); });

test('źródło aktywne zmienia stan, nieaktywne nie dotyka obiektu', () => {
  let got = 0;
  registerRealtime({ id: 'x', active: s => s.sec >= 0, tick: (s, ms) => { got = ms; return step(advance(s, 1), [{ html: 'tik' }]); } });
  const r = realtimeTick(game(), 1000);
  expect(r.state.t).toBe(1231); expect(r.lines).toEqual([{ html: 'tik' }]); expect(got).toBe(1000);
  clearRealtime(); const s = game(); expect(realtimeTick(s, 1000).state).toBe(s);
});
test('źródła misji działają tylko przy aktywnej misji', () => {
  restore = withMission('kuba', { realtime: [{ id: 'k', active: () => true, tick: s => step({ ...s, sec: 7 }) }] });
  expect(realtimeTick(game({ active: 'kuba' }), 1000).state.sec).toBe(7);
  expect(realtimeTick(game(), 1000).state.sec).toBe(0);
});
test('po terminie W. misja przegrywa raz', () => {
  const w = (t: number) => game({ day: 'czw', active: 'w', done: ['kuba'], t });
  expect(realtimeTick(w(19 * 60), 1000).state.failed).toBe(false);
  const r = realtimeTick(w(19 * 60 + 1), 1000);
  expect(r.state).toMatchObject({ failed: true, overlay: 'summary' });
  expect(realtimeTick(r.state, 1000).state).toBe(r.state);
});
test('pętla: pauza przy ukrytej karcie, resume, przyspieszenie', () => {
  let hidden = false, got = 0;
  registerRealtime({ id: 'x', active: () => true, tick: (s, ms) => { got = ms; return step(advance(s, 1)); } });
  const store = createStore(game());
  const loop = createRealtimeLoop(store, { speed: 10, isHidden: () => hidden });
  loop.tick(1000); expect(got).toBe(10000); expect(store.get().t).toBe(1231);
  hidden = true; loop.tick(1000); expect(loop.paused()).toBe(true); expect(store.get().t).toBe(1231);
  hidden = false; loop.tick(1000); expect(store.get().t).toBe(1231);   // dalej pauza do kliknięcia
  loop.resume(); loop.tick(1000); expect(store.get().t).toBe(1232);
});
test('pętla nie zapisuje, gdy nic się nie dzieje', () => {
  const st = memStorage(); const store = createStore(game(), { persist: st });
  createRealtimeLoop(store, { speed: 1, isHidden: () => false }).tick(1000);
  expect(st.getItem('neonos-save')).toBeNull();
});
test('realtimeSpeed', () => {
  expect(realtimeSpeed('?dev=1')).toBe(10); expect(realtimeSpeed('')).toBe(1); expect(realtimeSpeed('?dev=0')).toBe(1);
});
