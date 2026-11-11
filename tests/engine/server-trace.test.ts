import { expect, test } from 'vitest';
import { initWState } from '../../src/missions/w/state';
import { initSrvState, charge, traceRate } from '../../src/engine/server';
import { acceptOffer } from '../../src/engine/missions';
import { bug } from '../../src/engine/devices';
import { wStartState } from '../../src/missions/w/dev';
import { at, found, txt, withSrv } from '../missions/w/helpers';

test('initWState i initSrvState', () => {
  expect(initWState()).toMatchObject({ found: false, disc: false });
  expect(initSrvState()).toMatchObject({ trace: 0, alert: false, crack: null, dl: null, seen: ['/'], mc: { open: false, preview: null } });
});
test('przyjęcie: auth.log z dniem przyjęcia, srv wyzerowany', () => {
  const s = acceptOffer({ ...wStartState(), srv: { ...initSrvState(), trace: 50 } }, 'w').state;
  expect(s.srv.trace).toBe(0);
  expect(s.srv.log.map(l => l.t)[0]).toBe('czw 07:58  a.wisniewska  10.42.7.5    logowanie OK');
  expect(s.srv.log).toHaveLength(5);
  expect(s.srv).toMatchObject({ logSeq: 5, logClean: false });
});
test('charge: +v, czujny bank ×1,25 z zaokrągleniem', () => {
  const s = withSrv(found(), { trace: 10 });
  expect(charge(s, 2, 'cd x').r.state.srv).toMatchObject({ trace: 12, lastCmd: { cmd: 'cd x', v: 2 } });
  const a = withSrv(s, { alert: true });
  expect([1, 2, 3].map(v => charge(a, v, 'x').r.state.srv.lastCmd!.v)).toEqual([1.3, 2.5, 3.8]);
});
test('charge do 100%: zerwanie, koszty, wiersz w logu', () => {
  const s = at(withSrv(found(), { trace: 99 }), '/');
  const { r, caught } = charge(s, 2, 'cd finanse');
  expect(caught).toBe(true);
  expect(r.state.terminal.location).toEqual({ kind: 'S1' });
  expect([r.state.t - s.t, bug(s)!.minutes - bug(r.state)!.minutes]).toEqual([15, 5]);
  expect(r.state.srv).toMatchObject({ alert: true, caught: true, dl: null, editor: null });
  expect(r.state.srv.log.at(-1)).toMatchObject({ me: true, t: expect.stringContaining('10.42.0.250  nieudane logowanie') });
  expect(txt(r)).toContain('Namierzono cię przy 100%. Połączenie z 10.42.7.12 zerwane.');
  expect(txt(r)).not.toContain('Powrót:');
  expect(r.ui).toContainEqual({ kind: 'toast', text: 'Namierzono cię na serwerze! Połączenie zerwane.', bad: true });
});
test('traceRate', () => {
  expect(traceRate(found())).toBeCloseTo(0.7);
  expect(traceRate(withSrv(found(), { alert: true }))).toBeCloseTo(0.875);
});
