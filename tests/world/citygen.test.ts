import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { generateAll, serialize, SCENE_KEYS, rng as genRng } from '../../scripts/citygen.mjs';
import { rng } from '../../src/engine/rng';

const FILES = [...SCENE_KEYS, 'poznan', 'trip-routes', 'names'];

test('dwa uruchomienia dają identyczny JSON', () => {
  const a = generateAll(), b = generateAll();
  for (const k of FILES) expect(serialize(b[k])).toBe(serialize(a[k]));
});
test('pliki w src/world/city są aktualne (npm run gen:cities)', () => {
  const g = generateAll();
  for (const k of FILES) expect(readFileSync(`src/world/city/${k}.json`, 'utf8')).toBe(serialize(g[k]));
});
test('generator nie używa Math.random', () => {
  expect(readFileSync('scripts/citygen.mjs', 'utf8')).not.toMatch(/Math\.random/);
});
// liczby policzone w Node na kodzie makiety (mapa-miasta.html, V8 = Chrome)
test('sceny jak w makiecie: liczba budynków i ulic', () => {
  const g = generateAll() as any;
  const want = { nt: [178, 13], leszno: [485, 13], centrum: [770, 26], jezyce: [902, 35], winogrady: [374, 32],
    grunwald: [649, 23], wilda: [1105, 30], rataje: [469, 32], lawica: [764, 29] };
  for (const [k, [boxes, streets]] of Object.entries(want))
    expect([g[k].boxes.length, g[k].streets.length], k).toEqual([boxes, streets]);
  expect([g.poznan.boxes.length, g.poznan.cells.length]).toEqual([1287, 450]);
});
test('trasy wyjazdu jak w makiecie', () => {
  expect(generateAll()['trip-routes']).toMatchObject({ homeStreet: 'ul. Młyńska', s1Street: 'ul. Wąska',
    parkStreet: 'ul. Mickiewicza', stationStreet: 'Długa', entryStreet: 'ul. Długa' });
});
test('Centrum: 7 wieżowców jak w makiecie, S1, dworzec i wieżowiec celu', () => {
  const c = generateAll().centrum as any;
  expect(c.boxes.filter((b: any) => b.tower).length).toBe(7);
  expect(c.srcs[0].k).toBe('S1');
  expect(c.boxes.some((b: any) => b.label === 'dworzec')).toBe(true);
  expect(c.boxes[c.targetIndex].tower).toBe(1);
});
test('Nowy Tomyśl ma dom gracza i dworzec, a cel tylko w Centrum', () => {
  const g = generateAll() as any;
  expect(g.nt.home).not.toBeNull();
  expect(g.nt.boxes.some((b: any) => b.label === 'dworzec')).toBe(true);
  for (const k of SCENE_KEYS.filter((k: string) => k !== 'centrum')) {
    expect(g[k].targetIndex).toBeNull();
    expect(g[k].boxes.some((b: any) => b.target)).toBe(false);
  }
});
test('kolory aut to indeksy 0–5, nie heksy', () => {
  const c = generateAll().centrum as any;
  expect(c.cars.every((x: any) => Number.isInteger(x.col) && x.col >= 0 && x.col <= 5)).toBe(true);
});
test('rng generatora jest ten sam co w silniku (mulberry32)', () => {
  for (const seed of [1, 13, 7919 * 5 + 13, 2166136261]) {
    const a = genRng(seed), b = rng(seed);
    for (let i = 0; i < 50; i++) expect(a()).toBe(b());
  }
});
