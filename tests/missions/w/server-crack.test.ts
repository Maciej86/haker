import { expect, test } from 'vitest';
import { runLine, promptFor } from '../../../src/engine/terminal';
import { realtimeTick } from '../../../src/engine/realtime';
import { bug } from '../../../src/engine/devices';
import { stageIndex, termStep } from '../../../src/engine/missions';
import { wytrychAct, wytrychView } from '../../../src/engine/wytrych';
import { endCrack, turnTile } from '../../../src/engine/server';
import { ROT } from '../../../src/engine/wires';
import { wAfterTripState } from '../../../src/missions/w/dev';
import { cracking, found, onBank, run, txt, withSrv } from './helpers';

test('crack przed znalezieniem celu', () => {
  const s = run(wAfterTripState(), 'use S1', 'scan').state;
  const r = runLine(s, 'crack 10.42.7.12');
  expect(txt(r)).toContain('Nie wiesz jeszcze, do czego się włamać.');
  expect(txt(r)).not.toContain('Najpierw');
  expect(r.state.srv.crack).toBeNull();
});
test('start: 5 min gry, 2 min urządzenia, okno, etap 5', () => {
  const s = found(); const r = runLine(s, 'crack 10.42.7.12');
  expect([r.state.t - s.t, bug(s)!.minutes - bug(r.state)!.minutes]).toEqual([5, 2]);
  expect(r.state.srv).toMatchObject({ tries: 1, trace: 0 });
  expect(txt(r)).toContain('zabezpieczenie: bramka sieciowa, tryb przewodów · próba 1');
  expect(r.ui).toContainEqual({ kind: 'open', app: 'wytrych' });
  expect(r.ui).toContainEqual({ kind: 'startTimer', timer: 'crackTrace' });
  expect(termStep(r.state)).toBe('włamanie: Wytrych');
  expect(wytrychView(r.state).mode).toBe('wires');
});
test('odmowy startu', () => {
  expect(txt(runLine(cracking(), 'crack 10.42.7.12'))).toContain('Włamanie trwa.');
  expect(txt(runLine({ ...found(), devices: [{ id: 'bug1', where: 'S1', minutes: 2 }] }, 'crack 10.42.7.12'))).toContain('Za mało czasu pracy urządzenia na włamanie.');
  expect(txt(runLine(onBank(), 'crack 10.42.7.12'))).toContain('Jesteś już na 10.42.7.12.');
  const home = runLine(found(), 'disconnect').state;
  const r = runLine(home, 'crack 10.42.7.12');
  expect(txt(r)).toContain('<span class="r">Brak połączenia.</span>');
  expect(r.state.srv.tries).toBe(0);
});
test('10 s: +7% przy ADSL, 1 min gry i urządzenia, s1 stoi', () => {
  const s = cracking(); const r = realtimeTick(s, 10_000);
  expect(r.state.srv.trace).toBeCloseTo(7);
  expect([r.state.t - s.t, bug(s)!.minutes - bug(r.state)!.minutes]).toEqual([1, 1]);
  expect(r.state.srv.crack!.ms).toBe(10_000);
});
test('obrót: +1%, rozwiązanie: dostęp, +0,5 Sieć, etap 6', () => {
  const s = cracking(); const c = s.srv.crack!;
  const t = turnTile(s, 0, 0, 1);
  expect(t.state.srv.trace).toBe(1); expect(t.state.srv.crack!.moves).toBe(1);
  expect(wytrychAct(s, { kind: 'turn', r: 0, c: 0, dir: 1 }).state.srv.crack!.moves).toBe(1);
  // plansza o jeden obrót od rozwiązania: kafel (inRow,0) cofnięty o 1
  const almost = withSrv(s, { crack: { ...c, board: c.sol.map((row, i) => row.map((m, j) => i === c.inRow && j === 0 ? ROT(ROT(ROT(m))) : m)) } });
  const r = turnTile(almost, c.inRow, 0, 1);
  expect(r.state.terminal.location).toEqual({ kind: 'host', ip: '10.42.7.12', path: '/', via: 'S1' });
  expect(promptFor(r.state)).toBe('10.42.7.12:/ >');
  expect(r.state.gains).toContainEqual({ sk: 'Sieć', v: 0.5, why: 'włamanie bez namierzenia' });
  expect(txt(r)).toContain('Dostęp uzyskany: 10.42.7.12 · serwer plików centrali.');
  expect(txt(r)).not.toContain('Pliki:');
  expect(r.ui).toContainEqual({ kind: 'toast', text: 'Dostęp uzyskany · krok „Włamanie” zaliczony' });
  expect(r.state.srv).toMatchObject({ crack: null, res: 'ok', cracked: true, seen: ['/'] });
  expect(r.state.srv.log.at(-1)!.t).toContain('dostęp do serwera plików');
  expect(stageIndex(r.state)).toBe(6);
  expect(termStep(r.state)).toBe('znajdź zestawienie przyjęte przez zarząd');
});
test('100% w Wytrychu: zerwanie, −15/−5, czujny bank, potem szybciej i +0,3', () => {
  const s = withSrv(cracking(), { trace: 99.5 }); const r = realtimeTick(s, 1000);
  expect(r.state.srv).toMatchObject({ crack: null, res: 'caught', alert: true, caught: true });
  expect(r.state.t - s.t).toBe(15);
  expect(bug(s)!.minutes - bug(r.state)!.minutes).toBe(5);
  expect(r.state.terminal.location).toEqual({ kind: 'S1' });
  expect(txt(r)).toContain('Namierzono cię przy 100%. Połączenie z 10.42.7.12 zerwane.');
  expect(r.ui).toContainEqual({ kind: 'toast', text: 'Namierzono cię! Połączenie zerwane.', bad: true });
  const again = runLine(r.state, 'crack 10.42.7.12').state;
  expect(again.srv.tries).toBe(2); expect(again.srv.crack!.board).not.toEqual(s.srv.crack!.board);
  expect(realtimeTick(again, 10_000).state.srv.trace).toBeCloseTo(8.75);
  expect(endCrack(again, 'ok').state.gains).toContainEqual({ sk: 'Sieć', v: 0.3, why: 'włamanie, z namierzeniem po drodze' });
});
test('100% od obrotu kafelka', () => {
  const r = turnTile(withSrv(cracking(), { trace: 99 }), 0, 0, 1);
  expect(r.state.srv).toMatchObject({ crack: null, res: 'caught' });
});
test('abort i spadek namierzania', () => {
  const a = runLine(withSrv(cracking(), { trace: 50 }), 'abort');
  expect(a.state.srv).toMatchObject({ crack: null, res: 'abort' });
  expect(txt(a)).toContain('Przerwano włamanie. Namierzanie opada.');
  expect(realtimeTick(a.state, 1000).state.srv.trace).toBeCloseTo(10);
  expect(realtimeTick(a.state, 5000).state.srv.trace).toBe(0);
  expect(txt(runLine(found(), 'abort'))).toContain('Nic nie trwa.');
});
test('podsłuch pada w Wytrychu: koniec próby, dom', () => {
  const s = { ...cracking(), devices: [{ id: 'bug1' as const, where: 'S1' as const, minutes: 1 }] };
  const r = realtimeTick(s, 10_000);
  expect(r.state.srv.crack).toBeNull();
  expect(r.state.terminal.location).toEqual({ kind: 'home' });
  expect(bug(r.state)!.minutes).toBe(0);
});
test('drugie wejście: bez drugiego przyrostu', () => {
  const s = endCrack(runLine(runLine(onBank(), 'disconnect').state, 'crack 10.42.7.12').state, 'ok').state;
  expect(s.gains.filter(g => g.sk === 'Sieć' && g.why.startsWith('włamanie'))).toHaveLength(1);
});
