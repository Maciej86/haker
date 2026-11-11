import { expect, test } from 'vitest';
import type { GameState } from '../../../src/engine/types';
import { realtimeTick } from '../../../src/engine/realtime';
import { appBadges, stageIndex, termStep } from '../../../src/engine/missions';
import { buy } from '../../../src/engine/shop';
import { bug, tripAgain } from '../../../src/engine/devices';
import { isLinkedToS1 } from '../../../src/engine/commands/basic';
import { m3AfterTripState } from '../../../src/missions/m3/dev';
import { cams, run, txt } from './helpers';

const low = (s: GameState) => ({ ...s, devices: [{ id: 'bug1' as const, where: 'S1' as const, minutes: 1 }] });

test('pada przy kamerach: tekst L., dom, kup nowy', () => {
  const r = realtimeTick(low(cams()), 10_000);
  expect(isLinkedToS1(r.state)).toBe(false);
  expect(txt(r)).toContain('PODSŁUCH-1 wyczerpany. Połączenie z siecią za S1 zerwane.');
  expect(txt(r)).toContain('Misja trwa.');
  expect(txt(r)).not.toContain('Darknecie');
  expect(termStep(r.state)).toBe('kup nowy PODSŁUCH-1 w Darknecie');
  expect(stageIndex(r.state)).toBe(4);
});

test('zakup, skrót wyjazdu, dopisek L., plan od nowa', () => {
  const dead = realtimeTick(low(cams()), 10_000).state;
  const b = buy(dead, 'pods');
  expect(termStep(b.state)).toBe('podepnij nowy PODSŁUCH-1 przy S1');
  const t = tripAgain(b.state);
  expect(bug(t.state)!.minutes).toBe(60);
  expect(txt(t)).toContain('Kamery z trasy już znasz.');
  expect(txt(t)).not.toContain('use S1');
  expect(termStep(t.state)).toBe('zaplanuj kamery na 21:14 (at), potem disconnect i wait');
});

test('pada przed skanem: zamiast Mapy kup nowy, bez „!” na Mapie', () => {
  const r = realtimeTick(low(run(m3AfterTripState(), 'use S1').state), 10_000).state;
  expect(stageIndex(r)).toBe(1);
  expect(termStep(r)).toBe('kup nowy PODSŁUCH-1 w Darknecie');
  expect(appBadges(r)).not.toContain('map');
  const t = tripAgain(buy(r, 'pods').state).state;
  expect(termStep(t)).toBe('połącz się z PODSŁUCH-1 (use S1)');
});
