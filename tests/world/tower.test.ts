import { expect, test } from 'vitest';
import { TOWER_NODES, BRANCHES, hoursLabel, activity } from '../../src/world/tower';
const n = (ip: string) => TOWER_NODES.find((x) => x.ip === ip)!;

test('21 urządzeń w 7 podsieciach, bez kamer p. 7', () => {
  expect(TOWER_NODES).toHaveLength(21);
  expect(new Set(TOWER_NODES.map((x) => x.net))).toEqual(new Set(['2', '5', '7', '9', '12', '16', '21']));
  expect(TOWER_NODES.some((x) => /p\. 7/.test(x.kto))).toBe(false);
  expect(BRANCHES.map((b) => b[0])).toEqual(['2', '5', '7', '9', '12', '16', '21']);
  expect(BRANCHES[2][1]).toBe('przełącznik C · 10.42.7.x');
});
test('każde urządzenie ma 24 godziny aktywności 0..3', () => {
  for (const x of TOWER_NODES) { expect(x.akt).toHaveLength(24); expect(x.akt.every((v) => v >= 0 && v <= 3)).toBe(true); }
});
test('wybrane urządzenia', () => {
  expect(n('10.42.7.12')).toMatchObject({ sh: '◆', net: '7', kto: 'serwer plików centrali' });
  expect(n('10.42.9.2').kto).toBe('serwer projektów, Data-Tech');
});
test('hoursLabel', () => {
  expect(hoursLabel(n('10.42.7.12'))).toBe('8–18');
  expect(hoursLabel(n('10.42.7.31'))).toBe('1–4');
  expect(hoursLabel(n('10.42.7.20'))).toBe('cała doba');
  expect(activity(1, 4, 3)).toEqual(Array.from({ length: 24 }, (_, h) => (h >= 1 && h < 4 ? 3 : 0)));
});
