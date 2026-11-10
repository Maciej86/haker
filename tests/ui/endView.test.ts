import { expect, it } from 'vitest';
import { endView } from '../../src/screens/overlays/endView';
import { missionDef } from '../../src/engine/missions';
import { fmt } from '../../src/engine/text';
import { game } from '../engine/fixtures';

it('koniec demo', () => {
  const v = endView(game({ done: ['kuba'], day: 'pt', t: 21 * 60 + 40, xp: 280, lvl: 2, money: 4100 }));
  expect(v).toMatchObject({ head: 'Poziom 2', header: 'Ukończone zlecenia · pt 21:40', xp: '280 XP', money: fmt(4100), bug: null });
  expect(v.log).toEqual(['> Koniec demo.', '> Dziękujemy za grę.']);
  expect(v.done).toEqual([`✓ ${missionDef('kuba').title} (${missionDef('kuba').giver.name})`]);
  expect(v.skills.length).toBe(4);
});
it('podsłuch przy S1 z zapasem', () => {
  expect(endView(game({ devices: [{ id: 'bug1', where: 'S1', minutes: 23 }] })).bug).toBe('PODSŁUCH-1 przy S1: zostało 23 min');
  expect(endView(game({ devices: [{ id: 'bug1', where: 'S1', minutes: 0 }] })).bug).toBeNull();
  expect(endView(game({ devices: [{ id: 'bug1', where: 'plecak', minutes: 40 }] })).bug).toBeNull();
});
