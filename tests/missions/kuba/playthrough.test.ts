import { expect, test } from 'vitest';
import type { GameState } from '../../../src/engine/types';
import { newGame } from '../../../src/engine/state';
import { acceptOffer, visibleOffers } from '../../../src/engine/missions';
import { runLine, promptFor } from '../../../src/engine/terminal';
import { buy } from '../../../src/engine/shop';
import { wytrychAct } from '../../../src/engine/wytrych';
import { bakeAnswer } from '../../../src/missions/kuba/logic';
import { deliver } from '../../../src/engine/delivery';
import { nextDay } from '../../../src/engine/clock';
import '../../../src/missions';

/** Nowa gra → przyjęcie → connect → zakup Wytrycha → crack (okno Wytrycha otwarte). */
const toCrack = (): GameState => {
  let s = newGame(42);
  s = acceptOffer(s, 'kuba').state;                                       // 20:33
  s = runLine(s, 'connect 83.21.40.17').state;                            // 20:34
  s = buy(s, 'wyt').state;                                                // 0 ¤
  return runLine(s, 'crack 83.21.40.17').state;                           // 20:35
};
const answer = (s: GameState) => wytrychAct(s, { kind: 'answer', value: String(bakeAnswer(s.mission.kuba.bake!)) }).state;
const finishFiles = (s: GameState): GameState => {
  for (const c of ['ls', 'cat playlista.txt', 'get playlista.txt', 'disconnect']) s = runLine(s, c).state;
  return deliver(s, 'kuba', 'Proszę bardzo.', '83.21.40.17:playlista.txt').state;
};

test('misja Kuby od nowej gry do czwartku', () => {
  let s = answer(toCrack());                                              // 20:37
  expect(promptFor(s)).toBe('zenek:~ >');
  s = finishFiles(s);                                                     // 20:38
  expect(s.t).toBe(20 * 60 + 38);
  expect([s.money, s.xp, s.lvl]).toEqual([300, 120, 1]);
  expect(s.skills).toEqual({ 'Sieć': 2, 'Linux': 2, 'Skrypty': 0, 'Social': 1 });
  expect(s.gains.map(g => g.why)).toEqual(['hasło złamane za pierwszym razem', 'pierwsze ls na cudzym serwerze', 'pobranie i czyste rozłączenie']);
  expect(s.stats.first).toBe(true);
  expect(s.overlay).toBe('summary');
  s = nextDay(s).state;
  expect([s.day, s.t]).toEqual(['czw', 830]);
  expect(visibleOffers(s).filter(id => !s.done.includes(id))).toEqual(['w', 'm3']);
});
test('z podpowiedzią i złą odpowiedzią: Sieć 1,9, ta sama godzina', () => {
  let s = toCrack();
  expect(bakeAnswer(s.mission.kuba.bake!)).not.toBe(0);                  // '0' na pewno jest złą odpowiedzią
  s = wytrychAct(s, { kind: 'hint' }).state;
  s = wytrychAct(s, { kind: 'answer', value: '0' }).state;
  expect(s.mission.kuba.cracked).toBe(false);
  s = answer(s);
  expect(promptFor(s)).toBe('zenek:~ >');
  s = finishFiles(s);
  expect(s.t).toBe(20 * 60 + 38);
  expect(s.skills['Sieć']).toBeCloseTo(1.9);
  expect(s.gains[0].why).toBe('pierwsze włamanie Wytrychem');
  expect(s.done).toEqual(['kuba']);
  expect(s.overlay).toBe('summary');
});
