import '../../../src/missions';
import { expect, test } from 'vitest';
import type { GameState } from '../../../src/engine/types';
import { coachLine, stageIndex, termStep } from '../../../src/engine/missions';
import { M3_STAGES } from '../../../src/missions/m3/texts';
import { cams, withM3 } from './helpers';

test('etapy 5 i 6 oraz linijki', () => {
  const s = cams();
  const cases: [GameState, number, string][] = [
    [withM3(s, { err: 1, win: { start: 1304, len: 3 } }), 4, 'nowe okno: 21:44, 3 min'],
    [withM3(s, { leg: 2 }), 5, 'czekaj na wiadomość od L. (wyjście z 712)'],
    [withM3(s, { leg: 2, ok: true }), 6, 'posprzątaj i odpisz L. w Poczcie'],
  ];
  for (const [st, i, line] of cases) { expect(stageIndex(st)).toBe(i); expect(termStep(st)).toBe(line); expect(coachLine(st)).toBe(M3_STAGES[i].coach); }
  expect(termStep(withM3(s, { fail: true, err: 2 }))).toBe('zlecenie przegrane');
  expect(termStep(s)).toBe('zaplanuj kamery na 21:14 (at), potem disconnect i wait');
  expect(termStep(withM3(s, { err: 1, leg: 2 }))).toBe('czekaj na wiadomość od L. (wyjście z 712)');
});
