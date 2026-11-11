import { expect, test } from 'vitest';
import type { GameState } from '../../../src/engine/types';
import { realtimeTick } from '../../../src/engine/realtime';
import { appBadges, stageIndex, termStep } from '../../../src/engine/missions';
import { buy } from '../../../src/engine/shop';
import { bug, bugTripOffer, tripAgain } from '../../../src/engine/devices';
import { m3ClockView } from '../../../src/missions/m3/clock';
import { m3BugTooLate } from '../../../src/missions/m3/logic';
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

test('martwy podsłuch: zegar bez „Przewiń” i z radą o nowym', () => {
  const r = realtimeTick(low(cams()), 10_000).state;
  const v = m3ClockView(r)!;
  expect(v.jump).toBeNull();
  expect(v.note?.tone).toBe('red');
  expect(v.note?.html).toContain('Kup nowy w Darknecie');
});

test('martwy podsłuch po 19:20: za późno, zegar i pasek to mówią, „Przewiń” wraca', () => {
  const dead = realtimeTick(low(cams()), 10_000).state;
  const late = { ...dead, t: 19 * 60 + 30 };
  expect(m3BugTooLate(late)).toBe(true);
  expect(termStep(late)).toBe('za późno na nowy PODSŁUCH-1 przed 21:14');
  const v = m3ClockView(late)!;
  expect(v.note?.html).toContain('Nowy nie zdąży przed oknem 21:14');
  expect(v.jump).not.toBeNull();
  expect(m3BugTooLate({ ...dead, t: 19 * 60 })).toBe(false);
});

test('podmiana żywego podsłuchu: kup, jedź, zapas 60, zadania at zostają', () => {
  const s = run(cams(), 'at 21:14 cam off 10.42.5.31 3m', 'at 21:14 cam off 10.42.5.33 3m').state;
  const b = buy(s, 'pods').state;
  expect(bugTripOffer(b)).toBe(true);
  const t = tripAgain(b);
  expect(isLinkedToS1(t.state)).toBe(false);
  expect(bug(t.state)!.minutes).toBe(60);
  expect(txt(t)).toMatch(/Stary miał jeszcze \d+ min\./);
  expect(t.state.mission.m3.log.filter((c) => c.src === 'at')).toHaveLength(2);
});
