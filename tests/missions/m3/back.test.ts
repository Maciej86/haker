import '../../../src/missions';
import { expect, test } from 'vitest';
import type { GameState, StepResult, UiEvent } from '../../../src/engine/types';
import { runLine } from '../../../src/engine/terminal';
import { clockView, retryDay, stageIndex, termStep } from '../../../src/engine/missions';
import { deserialize, serialize } from '../../../src/engine/state';
import { offAt } from '../../../src/missions/m3/state';
import { PLAN_ROUTE } from '../../../src/missions/m3/plan';
import { m3Check } from '../../../src/missions/m3/window';
import { atBack, atT, back, cleanBack, lastMail, m3, okLeg1, run, txt, withM3 } from './helpers';

const walkOf = (r: StepResult) => r.ui.find((e) => e.kind === 'walk') as Extract<UiEvent, { kind: 'walk' }>;
const offRoute = (s: GameState) => run(s, 'cam off 10.42.5.31', 'cam off 10.42.5.33').state;
test('przed minutą po starcie powrotu nic się nie ocenia', () => {
  const s = atT(atBack(run(back(), 'use S1').state), 1310);
  expect(m3Check(s).state).toBe(s);
});
test('powrót dobrze przez at: ok, dwa udane okna, etap 6', () => {
  const s = cleanBack();
  expect(m3(s)).toMatchObject({ ok: true, leg: 2, err: 0, late: false, evalAt: 1310, wins: [{ start: 1274, len: 3 }, { start: 1310, len: 3 }] });
  expect(lastMail(s)).toEqual({ from: 'L.', when: 'czw 21:53', html: 'Wyszedł o 21:50 i jest już poza hotelem. Nikt go nie widział. Odpisz mi krótko, kiedy wszystko posprzątasz.' });
  expect([stageIndex(s), termStep(s), clockView(s)]).toEqual([6, 'posprzątaj i odpisz L. w Poczcie', null]);
  expect(s.gains.filter(g => g.sk === 'Skrypty')).toHaveLength(1);
});
test('powrót dobrze: linia, toast i kropka w drugą stronę', () => {
  const r = runLine(run(atBack(run(back(), 'use S1').state), 'disconnect').state, 'wait 21:51');
  expect(txt(r)).toContain('<span class="c">21:50 · wyszedł z 712 i zjechał windą. Nikt go nie widział.</span>');
  expect(walkOf(r).after).toContainEqual(expect.objectContaining({ kind: 'toast', text: 'L.: wyszedł niezauważony' })); // po przejściu kropki (plan 31)
  expect(r.ui).toContainEqual(expect.objectContaining({ kind: 'walk', path: [...PLAN_ROUTE].reverse(), stopAt: 1, holdMs: 600 }));
});
test('powrót ręcznie na czas: ok bez obniżki', () => {
  const r = m3Check(atT(offRoute(atT(run(back(), 'use S1').state, 1309)), 1311));
  expect(m3(r.state)).toMatchObject({ ok: true, late: false, err: 0 });
});
test('powrót za późno: 1500 ¤, bez drugiej próby, kropka w korytarzu B', () => {
  const r = m3Check(atT(back(), 1311));
  expect(m3(r.state)).toMatchObject({ ok: true, late: true, err: 1, win: { start: 1310, len: 3 } });
  expect(lastMail(r.state)).toMatchObject({ when: 'czw 21:53', bad: true,
    html: 'Kamery przy windzie i korytarz B działały, kiedy wychodził z pokoju. Zdążył wyjść, ale zostało nagranie. Zapłacę mniej. Odpisz, kiedy posprzątasz.' });
  expect(txt(r)).toContain('<span class="d">Misja trwa, zapłata mniejsza. Posprzątaj i odpisz L.</span>');
  expect(walkOf(r).after).toContainEqual({ kind: 'toast', text: 'L.: nagrany przy wyjściu, zapłata mniejsza', bad: true });
  expect(r.ui).toContainEqual(expect.objectContaining({ kind: 'mailArrives', thread: 'm3', exact: true }));
  expect(r.ui).toContainEqual(expect.objectContaining({ kind: 'walk', stopAt: 0.3, holdMs: 1400 }));
  const only31 = m3Check(atT(run(atT(run(back(), 'use S1').state, 1309), 'cam off 10.42.5.31').state, 1311));
  expect(only31.ui).toContainEqual(expect.objectContaining({ kind: 'walk', stopAt: 0.3 }));
  const only33 = m3Check(atT(run(atT(run(back(), 'use S1').state, 1309), 'cam off 10.42.5.33').state, 1311));
  expect(only33.ui).toContainEqual(expect.objectContaining({ kind: 'walk', stopAt: 0.85 }));
  expect(termStep(r.state)).toBe('posprzątaj i odpisz L. w Poczcie');
});
test('powrót za wcześnie: restart kamer, ok z obniżką', () => {
  const r = m3Check(atT(offRoute(run(back(), 'use S1').state), 1311));          // zgaszone o 21:47
  expect(m3(r.state)).toMatchObject({ ok: true, late: true, err: 1 });
  expect(offAt(m3(r.state), 1311)).toEqual([]);
  expect(lastMail(r.state).html).toBe('Ochrona zauważyła, że kamery przy windzie i korytarz B nie działają, zanim ruszył, i poszła sprawdzić. Zrestartowali kamery. Zdążył wyjść, ale zostało nagranie. Zapłacę mniej. Odpisz, kiedy posprzątasz.');
  expect(r.ui).toContainEqual(expect.objectContaining({ kind: 'walk', stopAt: 1 }));
});
test('drugi błąd w powrocie: odwołane, Spróbuj od nowa', () => {
  const r = m3Check(atT(withM3(back(), { err: 1, late: true }), 1311));
  expect(lastMail(r.state)).toMatchObject({ when: 'czw 21:50', bad: true,
    html: 'Kamery przy windzie i korytarz B działały, kiedy wychodził z pokoju. To już drugi raz. Zlecenie odwołane, nie płacę.' });
  expect(r.state).toMatchObject({ failed: true, overlay: 'summary' });
  expect(r.state.summaryMeta).toMatchObject({ next: 'retry', log: ['> L. odwołał zlecenie.', '> Zlecenie nieudane.'] });
  expect([m3(r.state).fail, m3(r.state).ok]).toEqual([true, false]);
  expect(retryDay(r.state)).toMatchObject({ t: 830, active: null, failed: false });
});
test('jeden wait przez wiadomość i okno powrotu: najpierw wiadomość, potem ocena', () => {
  const r = runLine(okLeg1(), 'wait 22:30');
  expect(m3(r.state)).toMatchObject({ noticed: true, ok: true, late: true, err: 1 });
  expect(r.state.mail.threads.m3.slice(-2).map(x => x.when)).toEqual(['czw 21:45', 'czw 21:53']);
  const h = txt(r); expect(h.indexOf('wychodzi o 21:50')).toBeLessThan(h.indexOf('wychodził z pokoju'));
});
test('wynik powrotu przetrwa zapis, a ocena się nie powtarza', () => {
  const s = cleanBack(); const b = deserialize(serialize(s))!;
  expect(m3(b)).toEqual(m3(s));
  expect(m3Check(atT(b, 1320)).ui).toEqual([]);
});
