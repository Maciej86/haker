import { expect, it } from 'vitest';
import { FIRST_WAVE, makeDrops, nextWave, stepDrop } from '../../src/screens/desktop/rain';

it('liczba kropel', () => { expect(makeDrops(1280, 800, () => 0.5)).toHaveLength(182); });
it('kropla z makeDrops', () => {
  expect(makeDrops(1280, 800, () => 0.5)[0]).toEqual({ x: 640, y: 400, v: 10, l: 15 });
});
it('fale: deszcz 30–60 s, przerwa 120–300 s, start 40 s', () => {
  expect(nextWave(1, () => 0)).toEqual({ target: 0, next: 120 }); expect(nextWave(1, () => 1)).toEqual({ target: 0, next: 300 });
  expect(nextWave(0, () => 0)).toEqual({ target: 1, next: 30 }); expect(nextWave(0, () => 1)).toEqual({ target: 1, next: 60 });
  expect(FIRST_WAVE).toBe(40);
});
it('kropla wraca na górę', () => { expect(stepDrop({ x: 100, y: 795, v: 10, l: 10 }, 800, 1280, () => 0.5)).toEqual({ x: 640, y: -20, v: 10, l: 10 }); });
it('kropla spada skośnie', () => { expect(stepDrop({ x: 100, y: 100, v: 10, l: 10 }, 800, 1280, () => 0.5)).toEqual({ x: 99.4, y: 110, v: 10, l: 10 }); });
