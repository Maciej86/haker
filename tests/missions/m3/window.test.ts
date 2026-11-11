import '../../../src/missions';
import { expect, test } from 'vitest';
import type { GameState } from '../../../src/engine/types';
import { runLine } from '../../../src/engine/terminal';
import { retryDay, termStep } from '../../../src/engine/missions';
import { realtimeTick } from '../../../src/engine/realtime';
import { deserialize, serialize } from '../../../src/engine/state';
import { initM3State, offAt } from '../../../src/missions/m3/state';
import { camName, judgeWindow, m3Check, m3Walk } from '../../../src/missions/m3/window';
import { atBothAt, atT, cams, home, m3, run, txt, withM3 } from './helpers';

const offBoth = (s: GameState) => run(s, 'cam off 10.42.5.31', 'cam off 10.42.5.33').state;
const lastMail = (s: GameState) => s.mail.threads.m3.at(-1)!;

test('nazwy kamer i trasa kropki', () => {
  expect(['10.42.5.31', '10.42.5.33'].map(camName)).toEqual(['przy windzie', 'korytarz B']);
  expect(m3Walk(null, false)).toMatchObject({ stopAt: 1, ms: 5200, holdMs: 600 });
  expect(m3Walk(null, false).path[0]).toEqual([300, 262]);
  expect(m3Walk('10.42.5.33', true)).toMatchObject({ stopAt: 0.3, holdMs: 1400 });
  expect(m3Walk('10.42.5.31', true).stopAt).toBe(0.85);
  expect(m3Walk('10.42.5.31', true).path[0]).toEqual([548, 182]);
  expect(judgeWindow(initM3State())).toEqual({ res: 'late', early: [], miss: ['10.42.5.31', '10.42.5.33'], extra: false });
});
test('przed minutą po starcie nic się nie ocenia', () => {
  const s = atT(offBoth(atT(cams(), 1273)), 1274);
  expect(m3Check(s).state).toBe(s);
});
test('dobrze przez at: etap 5, Skrypty +0,5, nowe okno powrotu', () => {
  const r = runLine(home(atBothAt(cams())), 'wait 21:15');
  expect(m3(r.state)).toMatchObject({ leg: 2, err: 0, late: false, evalAt: 1274, wins: [{ start: 1274, len: 3 }], notice: 1305, win: { start: 1310, len: 3 } });
  expect(r.state.gains).toContainEqual({ sk: 'Skrypty', v: 0.5, why: 'zadanie at dokładnie na okno' });
  expect(lastMail(r.state)).toMatchObject({ from: 'L.', when: 'czw 21:17' });
  expect(lastMail(r.state).html).toContain('Przeszedł o 21:14, jest w 712.');
  expect(txt(r)).toContain('<span class="c">21:14 · nasz człowiek przeszedł do 712. Nikt go nie widział.</span>');
  expect(txt(r)).not.toContain('Przewiń');
  expect(r.ui).toContainEqual({ kind: 'open', app: 'plan' });
  expect(r.ui).toContainEqual(expect.objectContaining({ kind: 'walk', stopAt: 1, ms: 5200, holdMs: 600 }));
  expect(r.ui).toContainEqual({ kind: 'toast', text: 'L.: jest w 712. Czekaj na wiadomość o wyjściu' });
  expect(r.state.mail.read).not.toContain('m3');
});
test('dobrze ręcznie: Skrypty +0,2', () => {
  const r = m3Check(atT(offBoth(atT(cams(), 1273)), 1275));
  expect(m3(r.state).leg).toBe(2);
  expect(r.state.gains).toContainEqual({ sk: 'Skrypty', v: 0.2, why: 'kamery wyłączone na czas' });
});
test('za wcześnie: restart kamer, 21:44 na 2 min, bez obniżki', () => {
  const r = m3Check(atT(offBoth(atT(cams(), 1272)), 1275));
  expect(m3(r.state)).toMatchObject({ leg: 1, err: 1, late: false, win: { start: 1304, len: 2 } });
  expect(offAt(m3(r.state), 1275)).toEqual([]);
  expect(lastMail(r.state)).toMatchObject({ when: 'czw 21:14', bad: true });
  expect(lastMail(r.state).html).toBe('Ochrona zauważyła, że kamery przy windzie i korytarz B nie działają, zanim ruszył, i poszła sprawdzić. Zrestartowali kamery. Druga i ostatnia próba o <b>21:44</b>, a ochrona jest czujniejsza: okno tylko <b>2 minuty</b>.');
  expect(txt(r)).toContain('<span class="y">Nowe okno: 21:44, 2 min.</span>');
  expect(r.ui).toContainEqual({ kind: 'toast', text: 'L.: za wcześnie. Nowe okno 21:44', bad: true });
  expect(termStep(r.state)).toBe('nowe okno: 21:44, 2 min');
});
test('za późno: 1500 ¤ (late), 21:44 na 3 min, kropka staje przy .31', () => {
  const r = m3Check(atT(cams(), 1275));
  expect(m3(r.state)).toMatchObject({ err: 1, late: true, win: { start: 1304, len: 3 } });
  expect(lastMail(r.state).html).toBe('Kamery przy windzie i korytarz B działały, kiedy wyszedł z windy. Wycofał się. Zapłacę mniej. Druga i ostatnia próba o <b>21:44</b> (3 minuty).');
  expect(r.ui).toContainEqual(expect.objectContaining({ kind: 'walk', stopAt: 0.18, holdMs: 1400 }));
  expect(r.ui).toContainEqual({ kind: 'toast', text: 'L.: za późno. Nowe okno 21:44', bad: true });
  const one = m3Check(atT(run(cams(), 'at 21:14 cam off 10.42.5.31 3m').state, 1275));
  expect(one.ui).toContainEqual(expect.objectContaining({ kind: 'walk', stopAt: 0.62 }));
  expect(lastMail(one.state).html).toContain('Kamera korytarz B działała, kiedy wyszedł z windy.');
});
test('7 minut: obchód ochrony, kamera wraca, błąd', () => {
  const ok = m3Check(atT(offBoth(atT(cams(), 1273)), 1275)).state;
  const quiet = atT(ok, 1279);
  expect(m3Check(quiet).state).toBe(quiet);
  const r = m3Check(atT(ok, 1280));
  expect(m3(r.state)).toMatchObject({ err: 1, late: true, leg: 2 });
  expect(m3(r.state).log.every(c => c.caught && c.on === 1280)).toBe(true);
  expect(lastMail(r.state)).toMatchObject({ when: 'czw 21:20', bad: true });
  expect(lastMail(r.state).html).toBe('Ochrona zrobiła obchód: kamery przy windzie i korytarz B nie działały dłużej niż 7 minut. Zrestartowali je. Nic nie znaleźli, ale będą czujniejsi. Zapłacę mniej. Następny błąd i odwołuję zlecenie.');
  expect(txt(r)).toBe('<span class="r">czw 21:20 · Ochrona zrobiła obchód: kamery przy windzie i korytarz B nie działały dłużej niż 7 minut. Zrestartowali je.</span> <span class="d">To błąd: zapłata mniejsza, kolejny błąd = przegrana.</span>');
  expect(r.ui).toContainEqual({ kind: 'toast', text: 'Ochrona sprawdziła kamerę: błąd', bad: true });
  const before = m3Check(atT(run(atT(cams(), 1200), 'cam off 10.42.5.32').state, 1207));
  expect(m3(before.state)).toMatchObject({ err: 1, win: { start: 1274, len: 3 } });
  expect(lastMail(before.state).html).toContain('Ochrona zrobiła obchód: kamera korytarz A nie działała dłużej niż 7 minut. Zrestartowali ją.');
});
test('skok przez okno i obchód naraz: najpierw ocena, potem błąd', () => {
  const r = runLine(offBoth(atT(cams(), 1273)), 'wait 21:30');
  expect(m3(r.state)).toMatchObject({ leg: 2, err: 1, late: true, wins: [{ start: 1274, len: 3 }] });
  const h = txt(r); expect(h.indexOf('przeszedł do 712')).toBeLessThan(h.indexOf('Ochrona zrobiła obchód'));
});
test('podsłuch padł przed oknem: zadania przepadły, okno za późno', () => {
  const dead = runLine(atBothAt(cams()), 'wait 21:00').state;           // zerwanie o 18:40, zadania przepadają
  const r = m3Check(atT(dead, 1275));
  expect(m3(r.state)).toMatchObject({ err: 1, late: true, win: { start: 1304, len: 3 } });
  const alive = withM3(atT(home(cams()), 1275), { log: [{ ip: '10.42.5.31', off: 1300, on: 1303, src: 'at' }] });
  const gone = m3Check({ ...alive, devices: [{ id: 'bug1', where: 'S1', minutes: 0 }] });
  expect(m3(gone.state).log).toEqual([]);
  expect(txt(gone)).toContain('Zadania at przepadły: PODSŁUCH-1 wyczerpany.');
});
test('zbędna kamera w oknie: extra', () => {
  const s = run(atBothAt(cams()), 'at 21:14 cam off 10.42.5.32 3m').state;
  expect(m3(m3Check(atT(home(s), 1275)).state).extra).toBe(true);
  expect(m3(m3Check(atT(home(atBothAt(cams())), 1275)).state).extra).toBe(false);
});
test('drugi błąd: odwołane, Spróbuj od nowa, powrót do dayCheckpoint', () => {
  const one = m3Check(atT(cams(), 1275)).state;
  const r = m3Check(atT(one, 1305));
  expect(lastMail(r.state).html).toContain('To już drugi raz. Zlecenie odwołane, nie płacę.');
  expect(r.state).toMatchObject({ failed: true, overlay: 'summary' });
  expect(r.state.summaryMeta).toMatchObject({ next: 'retry', log: ['> L. odwołał zlecenie.', '> Zlecenie nieudane.'] });
  expect([m3(r.state).fail, r.state.terminal.location.kind]).toEqual([true, 'home']);
  expect(txt(r)).toContain('<span class="r">Zlecenie przegrane.</span>');
  expect(m3Check(r.state).state).toBe(r.state);
  const back = retryDay(r.state);
  expect(back).toMatchObject({ t: 830, active: null, failed: false });
  expect(back.mission.m3).toEqual(initM3State());
  const twice = m3Check(atT(withM3(cams(), { err: 1, log: [{ ip: '10.42.5.32', off: 1100, on: null, src: 'man' }] }), 1107));
  expect(lastMail(twice.state).html).toContain('To już drugi błąd. Zlecenie odwołane, nie płacę.');
  expect(twice.state.failed).toBe(true);
});
test('straż oceny działa w tiku czasu rzeczywistego i przetrwa zapis', () => {
  const s = atT(home(cams()), 1275);
  expect(m3(realtimeTick(s, 1000).state).err).toBe(1);
  const r = m3Check(s).state;
  expect(m3(deserialize(serialize(r))!)).toEqual(m3(r));
  expect(m3Check(deserialize(serialize(r))!).ui).toEqual([]);
});
