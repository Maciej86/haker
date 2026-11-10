import { test, expect } from 'vitest';
import centrum from '../../src/world/city/centrum.json';
import { SCENE_KEYS } from '../../scripts/citygen.mjs';
import { readFileSync } from 'node:fs';

const TARGET_TENANTS = [
  { n: 'Recepcja, kawiarnia Ziarno', f: 'p. 0' },
  { n: 'Bank Wiślany, centrala', f: 'p. 1–4' },
  { n: 'Hotel Luksus', f: 'p. 5–10' },
  { n: 'Data-Tech sp. z o.o.', f: 'p. 11–14' },
  { n: 'Agencja reklamowa Pixel', f: 'p. 15–19' },
  { n: 'Siłownia FitTower', f: 'p. 20' },
  { n: 'Restauracja Panorama', f: 'p. 21 (ostatnie)' },
];
test('wieżowiec celu ma 22 piętra i lokatorów z mapa-swiata.md rozdz. 8', () => {
  const t: any = centrum.boxes[centrum.targetIndex!];
  expect(t.kind).toBe('tower');
  expect(Math.round(t.h / 6)).toBe(22);
  expect(t.tenants).toEqual(TARGET_TENANTS);
});
test('antena stoi na dachu wieżowca celu', () => {
  const t: any = centrum.boxes[centrum.targetIndex!];
  const a: any = centrum.boxes.find((b: any) => b.kind === 'antenna' && b.x === t.x + t.w / 2 - 3 && b.y === t.y + t.d / 2 - 3);
  expect(a.z0).toBe(t.z0 + t.h);
});
test('Hotel Luksus jest tylko w wieżowcu celu', () => {
  let n = 0;
  for (const k of SCENE_KEYS) {
    const s = JSON.parse(readFileSync(`src/world/city/${k}.json`, 'utf8'));
    for (const b of s.boxes) for (const t of b.tenants ?? []) if (t.n === 'Hotel Luksus') n++;
  }
  expect(n).toBe(1);
});
test('inne wieżowce mają hotele tylko z listy bez Luksusu', () => {
  const hotels = centrum.boxes.filter((b: any, i: number) => b.tower && i !== centrum.targetIndex)
    .flatMap((b: any) => b.tenants.map((t: any) => t.n)).filter((n: string) => n.startsWith('Hotel'));
  for (const h of hotels) expect(['Hotel Horyzont', 'Hotel Meridian', 'Hotel Wieża']).toContain(h);
});
