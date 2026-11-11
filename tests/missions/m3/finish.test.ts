import '../../../src/missions';
import { expect, test } from 'vitest';
import type { GameState } from '../../../src/engine/types';
import { isBlocked, missionDef, visibleOffers } from '../../../src/engine/missions';
import { canDeliver, replyBox } from '../../../src/engine/delivery';
import { nextDay } from '../../../src/engine/clock';
import { bug } from '../../../src/engine/devices';
import { m3Check } from '../../../src/missions/m3/window';
import { m3OpenCamsRow } from '../../../src/missions/m3/texts';
import { atBack, atT, back, cleanBack, lastMail, m3, report, run, withM3 } from './helpers';

const row = (s: GameState, end: string) => s.summary!.find(r => r.label.endsWith(end))!;
test('pole raportu dopiero po ocenie powrotu', () => {
  expect(missionDef('m3').delivery).toMatchObject({ kind: 'report', title: 'Odpowiedz L.' });
  expect([replyBox(back(), 'm3'), canDeliver(back(), 'm3')]).toEqual([null, false]);
  expect(replyBox(cleanBack(), 'm3')).toEqual({ title: 'Odpowiedz L.', text: 'Zrobione. Kamery posprzątane.', button: 'Wyślij raport', cost: 1, attach: false });
});
test('czysty raport: 2000 + 300 + 200 + 100, +80 XP, Bursztyn, Następny dzień', () => {
  const s = cleanBack(); const r = report(s);
  expect(r.state).toMatchObject({ t: 1312, money: s.money + 2600, xp: s.xp + 80, done: ['kuba', 'm3'], active: null, overlay: 'summary' });
  expect(lastMail(r.state)).toEqual({ from: 'Ty', when: 'czw 21:52', html: 'Zrobione. Kamery posprzątane.' });
  expect(r.state.summary!.slice(0, 4)).toEqual([
    { label: 'Nagroda za zlecenie', value: '2000 ¤', tone: 'ok' },
    { label: '✓ Oba przejścia bez błędu (tam i z powrotem)', value: '+300 ¤', tone: 'ok' },
    { label: '✓ Żadna zbędna kamera nie zgasła', value: '+200 ¤', tone: 'ok' },
    { label: '✓ Rozłączony z S1 przed raportem', value: '+100 ¤', tone: 'ok' }]);
  expect(r.state.summary).toContainEqual({ label: 'Odblokowano: motyw Bursztyn (Start → Motyw)', value: '', tone: 'ok' });
  expect(r.state.summary).toContainEqual({ label: `Czas: czw 21:52 · PODSŁUCH-1 zostało ${bug(r.state)!.minutes} min (zostaje przy S1)`, value: '' });
  expect(r.state.summary!.some(x => x.tone === 'bad')).toBe(false);
  expect(r.state.summaryMeta).toEqual({ log: ['> Raport wysłany: wszedł i wyszedł.', '> L. potwierdził.', '> Zlecenie zakończone.'], xp: 80, money: 2600, next: 'nextDay' });
  const d = nextDay(r.state).state;
  expect(d).toMatchObject({ day: 'pt', t: 830, overlay: null });
  expect(visibleOffers(d)).toContain('w'); expect(isBlocked(d, 'w')).toBe(false);
});
test('tekst raportu przez esc', () => {
  expect(lastMail(report(cleanBack(), '<b>x').state).html).toBe('&lt;b&gt;x');
});
test('błąd w powrocie: 1500 ¤ z etykietą, bez premii za oba przejścia', () => {
  const r = report(m3Check(atT(back(), 1311)).state);
  expect(r.state.summary![0]).toEqual({ label: 'Nagroda za zlecenie (pomniejszona: druga próba)', value: '1500 ¤', tone: 'ok' });
  expect(row(r.state, 'Oba przejścia bez błędu (tam i z powrotem)')).toEqual({ label: '· Oba przejścia bez błędu (tam i z powrotem)', value: '—' });
  expect(r.state.summaryMeta!.money).toBe(1800);
});
test('błąd tylko w drodze tam: też 1500 ¤', () => {
  const r = report(withM3(cleanBack(), { err: 1, late: true, wins: [{ start: 1310, len: 3 }] }));
  expect(r.state.summaryMeta!.money).toBe(1800);
});
test('zbędna kamera w oknie powrotu: bez +200', () => {
  const s = run(atBack(run(back(), 'use S1').state), 'at 21:50 cam off 10.42.5.32 3m', 'disconnect', 'wait 21:51').state;
  expect(row(report(s).state, 'Żadna zbędna kamera nie zgasła')).toEqual({ label: '· Żadna zbędna kamera nie zgasła', value: '—' });
});
test('raport z S1: bez +100, bez kary, gracz zostaje przy S1', () => {
  const s = run(cleanBack(), 'use S1').state; const r = report(s);
  expect(row(r.state, 'Rozłączony z S1 przed raportem')).toEqual({ label: '· Rozłączony z S1 przed raportem', value: '—' });
  expect(bug(r.state)!.minutes).toBe(bug(s)!.minutes);
  expect(r.state.terminal.location.kind).toBe('S1');
});
test('kamery zostawione wyłączone: wiersz z adresami, kamery z at pominięte', () => {
  const manual = m3Check(atT(run(atT(run(back(), 'use S1').state, 1309), 'cam off 10.42.5.31', 'cam off 10.42.5.33').state, 1311)).state;
  const r = report(atT(manual, 1330));                                  // po 7 min: obchodu już nie ma
  expect(r.state.summary).toContainEqual({ label: '2 kamery dalej wyłączone. Ochrona to zauważy rano.', value: '.31, .33', tone: 'bad' });
  expect(m3(r.state).err).toBe(0);
  const one = report(run(manual, 'cam on 10.42.5.33').state);
  expect(one.state.summary).toContainEqual({ label: '1 kamera dalej wyłączona. Ochrona to zauważy rano.', value: '.31', tone: 'bad' });
  expect(report(cleanBack()).state.summary!.some(x => x.label.includes('dalej wyłączon'))).toBe(false);
});
test('raport poza chwilą: przed oceną, drugi raz, po porażce', () => {
  const b = back(); expect(report(b).state).toBe(b);
  const done = report(cleanBack()).state; expect(report(done).state).toBe(done);
  const failed = m3Check(atT(withM3(back(), { err: 1, late: true }), 1311)).state;
  expect(canDeliver(failed, 'm3')).toBe(false); expect(report(failed).state).toBe(failed);
});
test('L. jako druga oferta: Koniec demo, motyw Halo Systems', () => {
  const r = report({ ...cleanBack(), done: ['kuba', 'w'] });
  expect(r.state.summaryMeta!.next).toBe('end');
  expect(r.state.summary).toContainEqual({ label: 'Odblokowano: motyw Halo Systems (Start → Motyw)', value: '', tone: 'ok' });
});
test('odmiana: 1 kamera, 2–4 kamery, 5+ kamer, 12–14 kamer, 22 kamery', () => {
  expect([1, 2, 4, 5, 7, 12, 14, 21, 22, 25].map(m3OpenCamsRow)).toEqual([
    '1 kamera dalej wyłączona. Ochrona to zauważy rano.',
    '2 kamery dalej wyłączone. Ochrona to zauważy rano.',
    '4 kamery dalej wyłączone. Ochrona to zauważy rano.',
    '5 kamer dalej wyłączonych. Ochrona to zauważy rano.',
    '7 kamer dalej wyłączonych. Ochrona to zauważy rano.',
    '12 kamer dalej wyłączonych. Ochrona to zauważy rano.',
    '14 kamer dalej wyłączonych. Ochrona to zauważy rano.',
    '21 kamer dalej wyłączonych. Ochrona to zauważy rano.',
    '22 kamery dalej wyłączone. Ochrona to zauważy rano.',
    '25 kamer dalej wyłączonych. Ochrona to zauważy rano.',
  ]);
});
