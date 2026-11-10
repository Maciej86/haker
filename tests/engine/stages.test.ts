import { test, expect, afterEach } from 'vitest';
import { stageView, stageIndex, coachLine } from '../../src/engine/missions';
import { game, withMission } from './fixtures';

let restore: (() => void) | undefined;
afterEach(() => { restore?.(); restore = undefined; });

test('stageView oznacza etapy i pokazuje coach tylko przy bieżącym', () => {
  restore = withMission('kuba', { stageIndex: () => 2 });
  const v = stageView(game());
  expect(v.map(x => x.mark)).toEqual(['✓', '✓', '▶', '4.', '5.', '6.']);
  expect(v[2]).toMatchObject({ title: 'Zakup Wytrycha', sub: 'Darknet, 100 ¤', state: 'now' });
  expect(v[2].coach).toBe('Serwer ma hasło. Otwórz <code>Darknet</code> i kup Wytrych 1.0.');
  expect(v[3].coach).toBeNull();
  expect(coachLine(game())).toBe(v[2].coach);
});
test('stageSub nadpisuje podtytuł; bez misji brak etapów', () => {
  restore = withMission('kuba', { stageSub: (_s, i) => i === 1 ? 'pominięte: PODSŁUCH-1 już wisiał przy S1' : null });
  expect(stageView(game())[1].sub).toBe('pominięte: PODSŁUCH-1 już wisiał przy S1');
  expect(stageView(game({ done: ['kuba'] }))).toEqual([]);
  expect(stageIndex(game({ done: ['kuba'] }))).toBe(-1);
});
