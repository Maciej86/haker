import { expect, test } from 'vitest';
import { drawBake, bakeAnswer, bakeRows, bakeHints } from '../../../src/missions/kuba/logic';
import { initKubaState } from '../../../src/missions/kuba/state';
import { newGame, serialize, deserialize } from '../../../src/engine/state';

test('drawBake: 2..6, różne, rogal×bułka > chleb dla ziaren 1..500', () => {
  for (let seed = 1; seed <= 500; seed++) {
    const b = drawBake(seed);
    for (const v of [b.chleb, b.bulka, b.rogal]) { expect(Number.isInteger(v)).toBe(true); expect(v).toBeGreaterThanOrEqual(2); expect(v).toBeLessThanOrEqual(6); }
    expect(new Set([b.chleb, b.bulka, b.rogal]).size).toBe(3);
    expect(b.rogal * b.bulka).toBeGreaterThan(b.chleb);
  }
});
test('drawBake jest deterministyczne i zależy od ziarna', () => {
  expect(drawBake(77)).toEqual(drawBake(77));
  expect(new Set(Array.from({ length: 50 }, (_, i) => JSON.stringify(drawBake(i + 1)))).size).toBeGreaterThan(5);
});
test('bakeAnswer = rogal × bułka − chleb', () => { expect(bakeAnswer({ chleb: 4, bulka: 3, rogal: 5 })).toBe(11); });
test('bakeRows: stały układ równań', () => {
  expect(bakeRows({ chleb: 4, bulka: 3, rogal: 5 })).toEqual([
    { items: ['chleb', '+', 'chleb', '+', 'chleb'], result: 12 },
    { items: ['chleb', '+', 'bulka'], result: 7 },
    { items: ['bulka', '+', 'bulka', '+', 'rogal'], result: 11 },
    { items: ['rogal', '×', 'bulka', '−', 'chleb'], result: null },
  ]);
});
test('bakeHints: trzy stopnie z wartościami', () => {
  expect(bakeHints({ chleb: 4, bulka: 3, rogal: 5 })).toEqual([
    'Pierwsze równanie ma same chleby: 3 chleby to 12, więc jeden chleb to 4.',
    'Z drugiego: chleb (4) + bułka = 7, więc bułka to 3. Z trzeciego: 3 + 3 + rogal = 11.',
    'Rogal to 5. Ostatnie: 5 × 3 − 4.',
  ]);
});
test('initKubaState', () => {
  expect(initKubaState()).toEqual({ conn: false, open: false, cracked: false, tries: 0, hints: 0, wrong: null, disc: false, bake: null });
});
test('wypieki w stanie przetrwają zapis i odczyt', () => {
  const s0 = newGame(5);
  const s = { ...s0, mission: { ...s0.mission, kuba: { ...s0.mission.kuba, bake: drawBake(5) } } };
  expect(deserialize(serialize(s))!.mission.kuba.bake).toEqual(drawBake(5));
});
