import { test, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const css = readFileSync('src/theme/map-tokens.css', 'utf8');
const block = (sel: string) => css.split(sel + '{')[1]?.split('}')[0] ?? '';
const names = (b: string) => [...b.matchAll(/(--(?:map|geo|trip)-[\w-]+)\s*:/g)].map(m => m[1]).sort();

test('Fosfor ma wartości z makiety', () => {
  const root = block(':root');
  for (const [k, v] of [['--map-old-roof','#14303a'],['--map-old-st','#2a5c5c'],['--map-tower-win','#9fe0d4'],
    ['--map-hip-roof','#2a2024'],['--map-g-park','#0f2622'],['--map-ground','#0c171c'],['--map-water','#0f2a3a'],
    ['--map-car-3','#6b2b36'],['--geo-land','#0e1f24'],['--trip-wall','#122a2e']] as const)
    expect(root).toMatch(new RegExp(`${k}\\s*:\\s*${v}\\s*;`));
});
test('każdy motyw poza Fosforem nadpisuje te same tokeny przez color-mix', () => {
  const base = names(block(':root'));
  for (const t of ['neon', 'bursztyn', 'halo']) {
    const b = block(`:root[data-theme="${t}"]`);
    expect(names(b)).toEqual(base);
    expect(b).not.toMatch(/#[0-9a-f]{6}/i);
    expect(b).toMatch(/color-mix\(in srgb, var\(--(acc|coin|red|blue|text)\) \d+%, var\(--bg\)\)/);
  }
});

const SCAN = ['src/world/city/render.ts', 'src/world/geo/render.ts', 'src/screens/map-poland', 'src/screens/map-city',
  'src/screens/trip', 'src/screens/maps-common'];
const files = (p: string): string[] => !existsSync(p) ? [] : statSync(p).isDirectory()
  ? readdirSync(p).flatMap(f => files(join(p, f))) : /\.(tsx?|css)$/.test(p) ? [p] : [];
test('mapy i wyjazd nie mają kolorów na sztywno', () => {
  for (const f of SCAN.flatMap(files)) {
    const src = readFileSync(f, 'utf8');
    expect(src, f).not.toMatch(/#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b/);
    expect(src, f).not.toMatch(/rgba?\(\s*\d/);
  }
});
test('każdy użyty token map jest zdefiniowany', () => {
  const defined = new Set(names(block(':root')));
  for (const f of SCAN.flatMap(files))
    for (const m of readFileSync(f, 'utf8').matchAll(/var\((--(?:map|geo|trip)-[\w-]+)\)/g))
      expect(defined.has(m[1]), `${f}: ${m[1]}`).toBe(true);
});
