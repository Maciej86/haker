import { test, expect } from 'vitest';
import { drawScene, drawCity } from '../../src/world/city/render';
import { buildingInfo, districtCard } from '../../src/world/city/info';
import centrum from '../../src/world/city/centrum.json';
import nt from '../../src/world/city/nt.json';
import poznan from '../../src/world/city/poznan.json';
const S = (x: unknown) => x as any;

test('Centrum w trybie gry nie zdradza celu', () => {
  for (const g of [drawScene(S(centrum)).g, drawScene(S(centrum), { mini: true }).g]) {
    expect(g).not.toContain('cel zlecenia');
    expect(g).not.toContain('◎');
    expect(g).not.toContain('var(--red)');
  }
  expect(drawScene(S(centrum)).g).toContain(`data-i="${centrum.targetIndex}"`);
});
test('Nowy Tomyśl ma dom gracza', () => expect(drawScene(S(nt)).g).toContain('⌂ DOM'));
test('rysunek używa tokenów, bez heksów', () => {
  const g = drawScene(S(centrum)).g + drawCity(S(poznan)).g;
  expect(g).not.toMatch(/#[0-9a-f]{6}/i);
  expect(g).toContain('var(--map-');
});
test('Poznań: napisy jak w makiecie, lotnisko niedostępne', () => {
  const g = drawCity(S(poznan)).g;
  for (const t of ['CENTRUM', 'RATAJE', 'DWORZEC GŁÓWNY', '✈ PORT LOTNICZY', 'Poznań-Warta · niedostępne w demo', 'Warta'])
    expect(g).toContain(t);
  expect(g).not.toContain('kliknij, żeby wejść');
});
test('rysowanie jest deterministyczne', () => {
  expect(drawCity(S(poznan)).g).toBe(drawCity(S(poznan)).g);
  expect(drawScene(S(centrum)).g).toBe(drawScene(S(centrum)).g);
});
test('karta budynku: kamienica, kondygnacje z wysokości', () => {
  const i = nt.boxes.findIndex((b: any) => b.kind === 'old' && !b.tenants);
  const info = buildingInfo(S(nt.boxes[i]), i);
  expect(info.type).toBe('kamienica');
  expect(info.floors).toBe(Math.max(1, Math.round(nt.boxes[i].h / 6)));
  expect(buildingInfo(S(nt.boxes[i]), i)).toEqual(info);
});
test('karta dzielnicy: Centrum ma dworzec na miejscu', () => {
  expect(districtCard(S(poznan), 'centrum').fromStation).toBe('na miejscu (dworzec w Centrum)');
  expect(districtCard(S(poznan), 'rataje').fromStation).toMatch(/^ok\. \d+,\d km · tramwaj \d+ min · taxi \d+ min$/);
});
