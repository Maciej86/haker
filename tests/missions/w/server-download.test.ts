import { expect, test } from 'vitest';
import { runLine } from '../../../src/engine/terminal';
import { realtimeTick } from '../../../src/engine/realtime';
import { termStep } from '../../../src/engine/missions';
import { INTERRUPTED_LINE, deserialize, interruptOnLoad, serialize } from '../../../src/engine/state';
import { dlProgress } from '../../../src/engine/server';
import { at, cracking, onBank, txt } from './helpers';

const V2 = 'zestawienie_oddzialow_2026_v2.xlsx';
const inDir = () => at(onBank(), '/finanse/zestawienia/2026');
test('get: 10 s przy ADSL, +7%, +2 min gry, plik w Pobranych', () => {
  const g = runLine(inDir(), `get ${V2}`);
  expect(txt(g)).toContain(`Pobieranie ${V2} (2,4 MB) · ok. 10 s · namierzanie rośnie`);
  expect(txt(g)).not.toContain('Uwaga');
  expect(g.state.srv.dl).toMatchObject({ secs: 10 });
  expect(g.state.srv.trace).toBe(inDir().srv.trace);
  expect(g.state.srv.lastCmd).toEqual({ cmd: `get ${V2}`, v: null });
  expect(g.ui).toContainEqual({ kind: 'startTimer', timer: 'download' });
  expect(dlProgress(realtimeTick(g.state, 4_000).state)).toBe(40);
  const r = realtimeTick(g.state, 10_000);
  expect(r.state.downloads).toEqual([{ name: V2, size: '2,4 MB', mission: 'w', host: '10.42.7.12', fileId: `10.42.7.12:${V2}` }]);
  expect(r.state.t - g.state.t).toBe(2);
  expect(r.state.srv.trace).toBeCloseTo(7);
  expect(r.state.srv.dl).toBeNull();
  expect(dlProgress(r.state)).toBeNull();
  expect(r.state.srv.log.at(-1)!.t).toContain(`pobranie: ${V2}`);
  expect(r.state.srv.lastCmd).toEqual({ cmd: `get ${V2} · pobrano`, v: null });
  expect(txt(r)).toContain(`Pobrano: ${V2}</span> <span class="d">→ Pobrane. Namierzanie stoi na 7%.`);
  expect(r.ui).toContainEqual({ kind: 'toast', text: `Pobrano ${V2}` });
  expect(r.ui).toContainEqual({ kind: 'stopTimer', timer: 'download' });
  expect(termStep(r.state)).toBe('zejdź z S1 (disconnect) i odeślij plik');
});
test('odmowy get', () => {
  const g = runLine(inDir(), `get ${V2}`).state;
  expect(txt(runLine(g, 'get zestawienie_oddzialow_2026.xlsx'))).toContain('Trwa już pobieranie.');
  const log = txt(runLine(at(onBank(), '/it/logi'), 'get auth.log'));
  expect(log).toContain('Log zmienia się co chwilę.');
  expect(log).not.toContain('Edytuj');
  const done = realtimeTick(g, 10_000).state;
  expect(txt(runLine(done, `get ${V2}`))).toContain('Ten plik już masz w Pobranych.');
  expect(txt(runLine(inDir(), 'get nie_ma.xlsx'))).toContain('Nie ma pliku „nie_ma.xlsx” w /finanse/zestawienia/2026.');
});
test('zip na ADSL: ostrzeżenie, zerwanie przy 100%, Pobrane puste', () => {
  const g = runLine(at(onBank(), '/archiwum'), 'get kopia_serwera_2026-11-06.zip');
  expect(txt(g)).toContain('<span class="y">Uwaga: przy tym łączu namierzanie dojdzie do 100%, zanim plik się pobierze.</span>');
  expect(txt(g)).not.toContain('Przerwij');
  let s = g.state; const lines: string[] = [];
  for (let i = 0; i < 15; i++) { const r = realtimeTick(s, 10_000); s = r.state; lines.push(txt(r)); }
  expect(s.downloads).toEqual([]);
  expect(s.srv).toMatchObject({ dl: null, caught: true, alert: true });
  expect(s.terminal.location).toEqual({ kind: 'S1' });
  expect(lines.join('\n')).toContain('Pobieranie przerwane.');
});
test('odświeżenie w trakcie pobierania: przerwane, „połączenie przerwane”', () => {
  const g = realtimeTick(runLine(inDir(), `get ${V2}`).state, 4_000).state;
  const back = interruptOnLoad(deserialize(serialize(g))!);
  expect(back.srv.dl).toBeNull();
  expect(back.downloads).toEqual([]);
  expect(back.terminal.lines.at(-1)).toEqual(INTERRUPTED_LINE);
  expect(back.terminal.location).toMatchObject({ kind: 'host', ip: '10.42.7.12' });
});
test('odświeżenie w Wytrychu: próba przerwana', () => {
  const back = interruptOnLoad(deserialize(serialize(cracking()))!);
  expect(back.srv).toMatchObject({ crack: null, res: 'abort' });
  const b = onBank(); expect(interruptOnLoad(b)).toBe(b);   // nic w toku → ten sam obiekt
});
test('abort w trakcie pobierania', () => {
  const a = runLine(runLine(inDir(), `get ${V2}`).state, 'abort');
  expect(txt(a)).toContain('Pobieranie przerwane.');
  expect(a.state.srv.dl).toBeNull();
});
test('disconnect w trakcie pobierania i podsłuch pada w trakcie', () => {
  const g = runLine(inDir(), `get ${V2}`).state;
  const d = runLine(g, 'disconnect');
  expect(txt(d)).toContain('Pobieranie przerwane.'); expect(d.state.srv.dl).toBeNull();
  const dead = realtimeTick({ ...g, devices: [{ id: 'bug1', where: 'S1', minutes: 1 }] }, 10_000);
  expect(dead.state.downloads).toEqual([]); expect(dead.state.terminal.location).toEqual({ kind: 'home' });
  expect(dead.state.srv.dl).toBeNull();
});
test('disconnect po pobraniu: Linux +0,3', () => {
  const s = realtimeTick(runLine(inDir(), `get ${V2}`).state, 10_000).state;
  expect(runLine(s, 'disconnect').state.gains).toContainEqual({ sk: 'Linux', v: 0.3, why: 'pobranie i czyste rozłączenie' });
});
