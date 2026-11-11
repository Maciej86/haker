import { expect, test } from 'vitest';
import { runLine } from '../../../src/engine/terminal';
import { realtimeTick } from '../../../src/engine/realtime';
import { canDeliver, deliver } from '../../../src/engine/delivery';
import { acceptOffer, isBlocked, retryDay, visibleOffers } from '../../../src/engine/missions';
import { deadlineLabel } from '../../../src/engine/clock';
import { devJumps } from '../../../src/engine/dev';
import { onServer } from '../../../src/engine/server';
import { wStartState } from '../../../src/missions/w/dev';
import { at, cracking, gotV2, home, onBank, sendV2, V2 } from './helpers';

const FAIL_META = { log: ['> Plik dotarł po terminie.', '> Zlecenie nieudane.'], xp: 0, money: 0, next: 'retry' };

test('wysłanie o 19:00: kończy się 19:01, list po terminie, porażka', () => {
  const s = { ...home(gotV2()), t: 1140 }; const r = sendV2(s);
  expect(r.state.mail.threads.w.at(-1)).toEqual({ from: 'W.', when: 'czw 19:04', bad: true, html: 'Po terminie. Zarząd zebrał się o 19:00 i było po sprawie. Nie płacę.' });
  expect(r.state).toMatchObject({ t: 1141, failed: true, overlay: 'summary', money: s.money, xp: s.xp, active: 'w' });
  expect(r.state.summaryMeta).toEqual(FAIL_META);
  expect(r.state.done).not.toContain('w');
  expect(canDeliver(r.state, 'w')).toBe(false);
});

test('zły plik po terminie: odpowiedź o terminie, nie o pliku', () => {
  const f = realtimeTick(runLine(at(onBank(), '/finanse/zestawienia/2026'), 'get zestawienie_oddzialow_2026_FINAL.xlsx').state, 10_000).state;
  const r = deliver({ ...home(f), t: 1140 }, 'w', 'x', '10.42.7.12:zestawienie_oddzialow_2026_FINAL.xlsx');
  expect(r.state.mail.threads.w.at(-1)!.html).toBe('Po terminie. Zarząd zebrał się o 19:00 i było po sprawie. Nie płacę.');
  expect(r.state.failed).toBe(true);
});

test('wysłanie o 18:59: zdąży na 19:00', () => {
  const r = sendV2({ ...home(gotV2()), t: 1139 });
  expect(r.state.done).toContain('w'); expect(r.state.failed).toBe(false);
});

test('termin mija w trakcie pobierania: koniec sesji, mail W., porażka', () => {
  const g = runLine(at(onBank(), '/finanse/zestawienia/2026'), `get ${V2}`).state;
  const r = realtimeTick({ ...g, t: 1141 }, 1000);
  expect(r.state.mail.threads.w.at(-1)).toEqual({ from: 'W.', when: 'czw 19:01', bad: true, html: 'Minęła 19:00. Zarząd zebrał się bez moich danych. Nie płacę.' });
  expect(r.state).toMatchObject({ failed: true, overlay: 'summary', downloads: [], terminal: { location: { kind: 'home' } } });
  expect(r.state.srv.dl).toBeNull();
  expect(r.ui).toContainEqual({ kind: 'stopTimer', timer: 'download' });
  expect(r.state.summaryMeta).toEqual(FAIL_META);
  expect(realtimeTick(r.state, 10_000).state).toBe(r.state);    // nic już nie liczy
});

test('termin mija w Wytrychu: próba przerwana', () => {
  const r = realtimeTick({ ...cracking(), t: 1141 }, 1000);
  expect(r.state.srv.crack).toBeNull(); expect(r.state.failed).toBe(true);
  expect(r.ui).toContainEqual({ kind: 'stopTimer', timer: 'crackTrace' });
});

test('19:00 równo: jeszcze nie porażka', () => {
  expect(realtimeTick({ ...home(gotV2()), t: 1140 }, 1000).state.failed).toBe(false);
});

test('Spróbuj od nowa: czwartek 13:50, przed przyjęciem, obie oferty', () => {
  const failed = realtimeTick({ ...gotV2(), t: 1141 }, 1000).state;
  const back = retryDay(failed);
  expect(back).toMatchObject({ day: 'czw', t: 830, money: 300, active: null, failed: false, overlay: null, summaryMeta: null, done: ['kuba'], downloads: [], devices: [] });
  expect(back.dayCheckpoint).toEqual(wStartState().dayCheckpoint);
  expect(visibleOffers(back)).toEqual(expect.arrayContaining(['w', 'm3']));
  expect(isBlocked(back, 'w')).toBe(false);
  const again = acceptOffer(back, 'w').state;
  expect(again.srv).toMatchObject({ trace: 0, caught: false, alert: false, logClean: false, logBad: false });
  expect(again.mission.w).toEqual({ found: false, disc: false, leftS1: false, sentOnSrv: false });
});

test('skok W. tuż przed 19:00', () => {
  const s = devJumps().find(j => j.id === 'w-deadline')!.make();
  expect(deadlineLabel(s)).toEqual({ text: 'czw 19:00 · zostało 2 min', red: true });
  expect(onServer(s)).toBe(true);
});
