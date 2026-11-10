import { test, expect } from 'vitest';
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
