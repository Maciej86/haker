import { expect, test } from 'vitest';
import type { GameState } from '../../../src/engine/types';
import { realtimeTick } from '../../../src/engine/realtime';
import { stageIndex, termStep } from '../../../src/engine/missions';
import { buy } from '../../../src/engine/shop';
import { bug, tripAgain } from '../../../src/engine/devices';
import { endCrack, onServer } from '../../../src/engine/server';
import { gotV2, onBank, run, sendV2, txt } from './helpers';

const low = (s: GameState) => ({ ...s, devices: [{ id: 'bug1' as const, where: 'S1' as const, minutes: 1 }] });

test('pada na serwerze: tekst W., dom, kup nowy', () => {
  const r = realtimeTick(low(onBank()), 10_000);
  expect(r.state.terminal.location).toEqual({ kind: 'home' });
  expect(txt(r)).toContain('PODSŁUCH-1 wyczerpany. Połączenie z siecią za S1 zerwane.');
  expect(txt(r)).toContain('Misja trwa. Nowy podsłuch kupisz w Darknecie (150 ¤), potem trzeba go podpiąć przy skrzynce S1.');
  expect(termStep(r.state)).toBe('kup nowy PODSŁUCH-1 w Darknecie');
  expect(stageIndex(r.state)).toBe(6);
});

test('zakup 150 ¤, skrót wyjazdu, use S1, ponowne włamanie bez drugiego przyrostu', () => {
  const dead = realtimeTick(low(onBank()), 10_000).state;
  const b = buy(dead, 'pods');
  expect(b.state.money).toBe(dead.money - 150);
  expect(txt(b)).toContain('Kupiono PODSŁUCH-1.');
  expect(termStep(b.state)).toBe('podepnij nowy PODSŁUCH-1 przy S1');
  const t = tripAgain(b.state);
  expect([t.state.t - b.state.t, b.state.money - t.state.money, bug(t.state)!.minutes]).toEqual([110, 58, 60]);
  // linia 1421 bez „Połącz się: use S1.” (Terminal nie podpowiada); to mówi pasek „co teraz”
  expect(txt(t)).toContain('Cel już znasz, ale do serwera trzeba się włamać od nowa.');
  expect(txt(t)).not.toContain('use S1');
  expect(termStep(t.state)).toBe('połącz się z PODSŁUCH-1 (use S1)');
  const back = endCrack(run(t.state, 'use S1', 'crack 10.42.7.12').state, 'ok').state;
  expect(onServer(back)).toBe(true);
  expect(back.gains.filter(g => g.sk === 'Sieć' && g.why.startsWith('włamanie'))).toHaveLength(1);
});

test('pada, gdy plik już w Pobranych: odeślij plik, oddanie działa', () => {
  const r = realtimeTick(low(run(gotV2(), 'disconnect').state), 10_000).state;   // na S1 z plikiem w Pobranych
  expect(termStep(r)).toBe('odeślij plik w Poczcie');
  expect(sendV2(r).state.done).toContain('w');
});
