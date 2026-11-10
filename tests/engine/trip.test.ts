import { test, expect, beforeEach, afterEach } from 'vitest';
import { TRANSPORTS, schedule, planFor, backLeg, transportOptions } from '../../src/engine/trip';
import { newGame } from '../../src/engine/state';
const H = (h: number, m: number) => h * 60 + m;

test('rozkład: regionalny :11/:41 tam, :20/:50 powrót; ekspres :32 tam, :58 powrót', () => {
  expect(TRANSPORTS.regio.out!.slice(0, 2)).toEqual([H(5,11), H(5,41)]);
  expect(TRANSPORTS.regio.back!.slice(0, 2)).toEqual([H(5,20), H(5,50)]);
  expect(TRANSPORTS.ic.out!.slice(0, 2)).toEqual([H(5,32), H(6,32)]);
  expect(TRANSPORTS.ic.back![0]).toBe(H(5,58));
  expect(TRANSPORTS.regio.out!.at(-1)).toBe(H(25,41));
  expect(schedule(58, 60).at(-1)).toBe(H(25,58));
});
test('ceny i czasy jazdy ze specu', () => {
  expect([TRANSPORTS.regio.cost, TRANSPORTS.regio.ride]).toEqual([23, 46]);
  expect([TRANSPORTS.ic.cost, TRANSPORTS.ic.ride]).toEqual([37, 30]);
  expect([TRANSPORTS.car.cost, TRANSPORTS.car.park, TRANSPORTS.car.ride]).toEqual([25, 8, 65]);
});
test('plan z 14:08 jak w polaczenia-kolejowe.md', () => {
  const r = planFor(H(14,8), 'regio'), e = planFor(H(14,8), 'ic'), c = planFor(H(14,8), 'car');
  expect([r.dep, r.arrive, r.backDep, r.end, r.cost]).toEqual([H(14,41), H(15,40), H(16,20), H(17,23), 46]);
  expect([e.dep, e.arrive, e.backDep, e.end, e.cost]).toEqual([H(14,32), H(15,15), H(15,58), H(16,45), 74]);
  expect([c.dep, c.arrive, c.backDep, c.end, c.cost]).toEqual([null, H(15,27), null, H(16,52), 58]);
});
test('odcinki pociągu i samochodu', () => {
  expect(planFor(H(14,8), 'regio').legs.map(l => l.id)).toEqual(['walk1','wait1','ride1','walk2','site','back']);
  expect(planFor(H(14,8), 'car').legs.map(l => l.id)).toEqual(['walk1','ride1','drive2','park','walk2','site','back']);
  expect(planFor(H(14,8), 'ic').legs[2]).toMatchObject({ name: 'Ekspres → Poznań Główny', mode: 'POCIĄG', map: 'pl' });
});
test('powrót po ostatnim pociągu: ostatni + 60 min', () => {
  expect(backLeg('ic', H(26,0)).dep).toBe(H(25,58) + 60);
});
test('późny wyjazd nie wywraca planu', () => {
  const p = planFor(H(23,50), 'ic');
  expect(p.dep).toBe(H(24,32));
  expect(p.end).toBe(H(25,58) + 30 + 17);
});
test('za mało pieniędzy wyłącza drogie środki', () => {
  const s = { ...newGame(1), t: H(14,8), money: 50 };
  expect(Object.fromEntries(transportOptions(s).map(o => [o.id, o.affordable]))).toEqual({ regio: true, ic: false, car: false });
});

import { siteSteps, initTalk, talkAnswer, talkKey, talkOptions, talkGain, talkQuestion, tripOutcome, tripBlock,
  planTrip, finishTrip, cancelTrip, tripFailed, hasPackage, TRIP_FAILED_SUB, type TalkKind } from '../../src/engine/trip';
import { MISSIONS } from '../../src/missions';
import { SAMPLE_TRIP } from '../../src/world/trip/sample';
import type { GameState } from '../../src/engine/types';

const orig = MISSIONS.w;
beforeEach(() => { (MISSIONS as any).w = { ...orig, trip: SAMPLE_TRIP }; });
afterEach(() => { (MISSIONS as any).w = orig; });
const base = (o: Partial<GameState> = {}): GameState =>
  ({ ...newGame(7), done: ['kuba'], active: 'w', day: 'czw', t: H(14,8), money: 400, screen: 'trip', ...o });
const talk = (...p: TalkKind[]) => p.reduce(talkAnswer, initTalk());
const T = { place: 'centrum', building: 0, isTarget: true } as const;

test('6 kroków z paczką, 5 bez', () => {
  expect(siteSteps(false).map(s => [s.title, s.minutes])).toEqual([['Odbierasz paczkę',3],['Rozglądasz się',1],
    ['Otwierasz szafkę',1],['Podpinasz PODSŁUCH-1',2],['Test łącza',1],['Zamykasz szafkę',1]]);
  expect(siteSteps(true).map(s => s.id)).toEqual(['look','open','plug','test','close']);
});
test('przechodzień: gładko, z trudem, ucieczka', () => {
  expect(talkGain(talk('good','good'))).toEqual({ v: 0.6, why: 'rozmowa z przechodniem, gładko', badge: 'wybrnięte gładko' });
  expect(talkGain(talk('good','mid','good'))?.v).toBe(0.4);
  expect(talk('mid','mid').end).toBe('fled');
  expect(talk('flee')).toMatchObject({ end: 'fled', round: 1 });
  expect(talkGain(talk('flee'))?.v).toBe(0.15);
  expect(talk('good','mid','mid').end).toBe('fled');
  expect(talk('good','mid','good').round).toBe(3);
});
test('kolejne pytania zależą od odpowiedzi', () => {
  expect(talkKey(initTalk())).toBe('start');
  expect(talkKey(talk('good'))).toBe('afterGood');
  expect(talkKey(talk('mid'))).toBe('afterMid');
  expect(talkKey(talk('good','mid'))).toBe('last');
  expect(talkQuestion(initTalk(), H(22,30))).toBe('Co pan tu robi w nocy przy tej szafce?');
});
test('4 odpowiedzi, tasowanie stałe dla ziarna', () => {
  const o = talkOptions(7, initTalk());
  expect(o).toHaveLength(4);
  expect(o.map(x => x[0]).sort()).toEqual(['flee','good','mid','mid']);
  expect(talkOptions(7, initTalk())).toEqual(o);
  expect(o.find(x => x[0] === 'good')![1]).toContain('w tym budynku');
});
test('wynik wyjazdu: regionalny, gładko', () => {
  expect(tripOutcome(base(), { transport: 'regio', talk: talk('good','good') }))
    .toEqual({ outcome: 'ok', siteStart: H(15,40), siteEnd: H(15,51), backDep: H(16,20), end: H(17,23), cost: 46 });
});
test('wynik wyjazdu: ucieczka liczy bilet powrotny', () => {
  expect(tripOutcome(base(), { transport: 'regio', talk: talk('flee') }))
    .toMatchObject({ outcome: 'fled', siteEnd: H(15,46), end: H(17,23), cost: 46 });
  expect(tripOutcome(base(), { transport: 'ic', talk: talk('good','good') })).toMatchObject({ end: H(16,45), cost: 74 });
  expect(tripOutcome(base(), { transport: 'car', talk: talk('good','good') })).toMatchObject({ end: H(16,51), cost: 58 });
});
test('finishTrip ok: podsłuch przy S1, czas, pieniądze, Social +0,6', () => {
  const r = finishTrip(base(), { transport: 'regio', talk: talk('good','good') });
  expect(r.state).toMatchObject({ t: H(17,23), money: 354, screen: 'desktop', devices: [{ id: 'bug1', where: 'S1', minutes: 60 }] });
  expect(r.state.trip).toEqual({ mission: 'w', last: 'ok', trips: 1, suspicious: false });
  expect(r.ui).toContainEqual(expect.objectContaining({ kind: 'gain', sk: 'Social', v: 0.6 }));
  expect(r.lines.map(l => l.html).join()).toContain('PODSŁUCH-1 czeka podpięty');
});
test('ucieczka: podsłuch i klucz w plecaku, drugi wyjazd bez paczki', () => {
  const r = finishTrip(base(), { transport: 'regio', talk: talk('flee') });
  expect(r.state.devices).toEqual([{ id: 'bug1', where: 'plecak', minutes: 60 }]);
  expect(r.state.trip).toMatchObject({ last: 'fled', suspicious: true });
  expect(tripFailed(r.state)).toBe(true);
  expect(TRIP_FAILED_SUB).toBe('nieudane, jedź jeszcze raz');
  expect(hasPackage(r.state)).toBe(true);
  expect(tripBlock(r.state, T)).toBeNull();
  const again = { ...planTrip(r.state, T).state };
  expect(again.screen).toBe('trip');
  expect(siteSteps(hasPackage(again))[0].id).toBe('look');
  const r2 = finishTrip(again, { transport: 'car', talk: talk('good','good') });
  expect(r2.state.devices).toEqual([{ id: 'bug1', where: 'S1', minutes: 60 }]);
  expect(tripFailed(r2.state)).toBe(false);
});
test('drugie wywołanie finishTrip nic nie zmienia', () => {
  const r = finishTrip(base(), { transport: 'regio', talk: talk('good','good') });
  expect(finishTrip(r.state, { transport: 'regio', talk: talk('good','good') }).state).toBe(r.state);
});
test('blokady wyjazdu', () => {
  expect(tripBlock(base({ active: null }), T)).toBe('Najpierw przyjmij zlecenie w Poczcie.');
  expect(tripBlock(base({ active: 'kuba' }), T)).toBe('Do Zenka nie musisz jechać: znasz IP jego serwera.');
  expect(tripBlock(base(), { ...T, isTarget: false })).toBe('Tu nie ma nic, co pomoże w zleceniu. Wyjazd zabrałby czas i pieniądze.');
  expect(tripBlock(base({ devices: [{ id: 'bug1', where: 'S1', minutes: 30 }] }), T)).toBe('Twój PODSŁUCH-1 już wisi przy S1. Połącz się: use S1');
  expect(tripBlock(base({ devices: [{ id: 'bug1', where: 'S1', minutes: 0 }] }), T)).toBe('Twój PODSŁUCH-1 przy S1 jest wyczerpany. Nowy kupisz w Darknecie.');
});
test('planTrip przy blokadzie: toast, ekran bez zmian', () => {
  const s = base({ screen: 'mapCity', devices: [{ id: 'bug1', where: 'S1', minutes: 30 }] });
  const r = planTrip(s, T);
  expect(r.state.screen).toBe('mapCity');
  expect(r.ui[0]).toMatchObject({ kind: 'toast', bad: true });
});
test('Anuluj wraca do Centrum bez kosztów', () => {
  expect(cancelTrip(base())).toMatchObject({ screen: 'mapCity', mapCityTab: 'poznan', mapCityDistrict: 'centrum', t: H(14,8), money: 400 });
});
test('onTripDone misji dopisuje linie', () => {
  (MISSIONS as any).w = { ...MISSIONS.w, onTripDone: (s: GameState) => ({ state: s, lines: [{ html: 'X-MISJA' }], ui: [] }) };
  expect(finishTrip(base(), { transport: 'ic', talk: talk('good','good') }).lines.at(-1)!.html).toBe('X-MISJA');
});
test('późny powrót nie przechodzi przez północ', () => {
  expect(finishTrip(base({ t: H(23,0) }), { transport: 'regio', talk: talk('good','good') }).state.t).toBe(H(23,59));
});
