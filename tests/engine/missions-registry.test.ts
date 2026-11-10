import { test, expect } from 'vitest';
import { MISSION_ORDER, MAIL_ORDER, MISSIONS } from '../../src/missions';
import { missionDef, findHost } from '../../src/engine/missions';
test('rejestr ma trzy misje w kolejności demo', () => {
  expect(MISSION_ORDER).toEqual(['kuba', 'w', 'm3']);
  expect(MAIL_ORDER).toEqual(['w', 'm3', 'kuba']);
  expect(Object.keys(MISSIONS).sort()).toEqual(['kuba', 'm3', 'w']);
});
test('missionDef zwraca dane ze szkieletu', () => {
  expect(missionDef('kuba').offer.reward).toBe(300);
  expect(missionDef('w').deadline).toEqual({ time: 1140 });
  expect(missionDef('m3').deadline).toBeUndefined();
  expect(missionDef('kuba').stages).toHaveLength(6);
  expect(missionDef('w').stages).toHaveLength(7);
  expect(missionDef('m3').stages[4].title).toBe('Okno 21:14: do 712');
  expect(missionDef('w').availability.afterMissions).toEqual(['kuba']);
  expect(missionDef(null)).toBeUndefined();
  expect(missionDef(undefined)).toBeUndefined();
});
test('findHost znajduje serwer Zenka', () => {
  expect(findHost('83.21.40.17')?.promptName).toBe('zenek');
  expect(findHost('1.2.3.4')).toBeUndefined();
});
test('etap Zakupu Wytrycha zgodny z makietą', () => {
  expect(missionDef('kuba').stages[2]).toEqual({ title: 'Zakup Wytrycha', sub: 'Darknet, 100 ¤', coach: 'Serwer ma hasło. Otwórz <code>Darknet</code> i kup Wytrych 1.0.' });
});
