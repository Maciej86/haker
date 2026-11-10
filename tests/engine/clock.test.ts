import { test, expect } from 'vitest';
import { hhmm, gclk, dur, nextDayName, advance, dayVars } from '../../src/engine/clock';
import { game } from './fixtures';

test('hhmm, gclk, dur', () => {
  expect(hhmm(20 * 60 + 5)).toBe('20:05');
  expect(gclk(game({ day: 'czw', t: 14 * 60 + 5 }))).toBe('czw 14:05');
  expect(dur(65)).toBe('1 h 5 min'); expect(dur(60)).toBe('1 h 0 min'); expect(dur(29)).toBe('29 min');
});
test('nextDayName zawija tydzień', () => {
  expect(nextDayName('śr')).toBe('czw'); expect(nextDayName('nd')).toBe('pon');
});
test('advance nie przechodzi przez północ', () => {
  expect(advance(game({ t: 23 * 60 + 50 }), 20).t).toBe(23 * 60 + 59);
});
test('advance zużywa podsłuch przy S1, nie poniżej zera, bez mutacji', () => {
  const s = game({ devices: [{ id: 'bug1', where: 'S1', minutes: 2 }] });
  const n = advance(s, 3, 3);
  expect(n.devices[0].minutes).toBe(0);
  expect(s.devices[0].minutes).toBe(2);
  expect(advance(game({ devices: [{ id: 'bug1', where: 'plecak', minutes: 60 }] }), 1, 5).devices[0].minutes).toBe(60);
});
test('dayVars', () => {
  expect(dayVars(game({ day: 'czw' }))).toEqual({ 'dzień': 'czw', 'dzień_długi': 'czwartek' });
});
