import { expect, test } from 'vitest';
import { nextDay } from '../../../src/engine/clock';
import { bug } from '../../../src/engine/devices';
import { stageView } from '../../../src/engine/missions';
import { deserialize, serialize } from '../../../src/engine/state';
import { endView } from '../../../src/screens/overlays/endView';
import { kubaDay, playL, playW, take } from './play';

const SKIP = 'pominięte: PODSŁUCH-1 już wisiał przy S1';
const both = (first: 'w' | 'm3', keepBug: boolean) => {
  const one = (first === 'w' ? playW : playL)(take(kubaDay(), first, false));
  expect(one.summaryMeta).toMatchObject({ next: 'nextDay', money: first === 'w' ? 3400 : 2600 });
  const day2 = deserialize(serialize(nextDay(one).state))!;
  expect(day2).toMatchObject({ day: 'pt', t: 830 });
  const second = first === 'w' ? 'm3' : 'w';
  if (keepBug) expect(bug(day2)!.minutes).toBeGreaterThan(15);                // zapas wystarczy na drugą misję
  const taken = take(day2, second, keepBug);
  // Etap wyjazdu: u L. drugi, u W. trzeci (po „Rozpoznanie: cel na mapie”).
  const tripRow = stageView(taken).find((r) => r.title === 'Wyjazd i podłożenie podsłuchu')!;
  expect(tripRow.sub).toEqual(keepBug ? SKIP : expect.not.stringContaining('pominięte'));
  const end = (second === 'w' ? playW : playL)(taken);
  expect(end.summaryMeta).toMatchObject({ next: 'end', money: second === 'w' ? 3400 : 2600 });
  expect(end.done).toEqual(['kuba', first, second]);
  expect(endView(end)).toMatchObject({ head: 'Poziom 2', xp: '280 XP' });
  expect(end.summary).toContainEqual({ label: 'Odblokowano: motyw Halo Systems (Start → Motyw)', value: '', tone: 'ok' });
  return end;
};
test('Kuba → W. → L., podsłuch zostaje przy S1', () => { both('w', true); });
test('Kuba → W. → L., bez podsłuchu (drugi wyjazd)', () => { both('w', false); });
test('Kuba → L. → W., podsłuch zostaje przy S1', () => { both('m3', true); });
test('Kuba → L. → W., bez podsłuchu (drugi wyjazd)', () => { both('m3', false); });
