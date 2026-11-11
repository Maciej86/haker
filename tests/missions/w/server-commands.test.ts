import { expect, test } from 'vitest';
import type { GameState } from '../../../src/engine/types';
import { runLine, promptFor } from '../../../src/engine/terminal';
import { at, found, onBank, txt, withSrv } from './helpers';

const tr = (s: GameState) => s.srv.trace;
test.each([
  ['ls', '/', 1], ['ls finanse', '/', 1], ['cd finanse', '/', 2], ['cd ..', '/finanse', 2],
  ['info README.txt', '/it', 1], ['cat README.txt', '/it', 3], ['mc', '/', 0],
])('%s w %s: namierzanie +%s', (cmd, path, v) => {
  const s = at(onBank(), path); expect(tr(runLine(s, cmd).state) - tr(s)).toBeCloseTo(v);
});
test('czujny bank: ls +1,3, cd +2,5, cat +3,8', () => {
  const s = at(onBank({ alert: true }), '/it');
  expect(['ls', 'cd /', 'cat README.txt'].map(c => runLine(s, c).state.srv.trace - s.srv.trace)).toEqual([1.3, 2.5, 3.8].map(v => expect.closeTo(v)));
});
test('ls: katalogi i pliki z rozmiarem i datą', () => {
  const r = runLine(at(onBank(), '/finanse/zestawienia/2026'), 'ls');
  expect(r.lines[0].html).toBe('<span class="d">10.42.7.12:/finanse/zestawienia/2026</span>');
  expect(r.lines[1].html).toBe('<span class="c">wersje_robocze/</span>');
  expect(r.lines.map(l => l.html)).toContain(`${'zestawienie_oddzialow_2026_v2.xlsx'.padEnd(42)}${'2,4 MB'.padEnd(10)}2026-10-20`);
  expect(r.state.srv.lastCmd).toEqual({ cmd: 'ls', v: 1 });
});
test('ls: pobrany plik oznaczony', () => {
  const s = at(onBank(), '/it');
  const d = { ...s, downloads: [{ name: 'README.txt', size: '0,01 MB', mission: 'w' as const, host: '10.42.7.12', fileId: '10.42.7.12:README.txt' }] };
  expect(txt(runLine(d, 'ls'))).toContain('2025-03-11  <span class="c">pobrany</span>');
});
test('ls na pliku: odmowa bez kosztu', () => {
  const s = at(onBank(), '/it'); const r = runLine(s, 'ls README.txt');
  expect(txt(r)).toContain('<span class="r">ls: nie ma katalogu README.txt</span>');
  expect(tr(r.state)).toBe(tr(s));
});
test('cd zmienia znak zachęty, info pokazuje zatwierdzenie', () => {
  const s = runLine(onBank(), 'cd finanse/zestawienia/2026').state;
  expect(promptFor(s)).toBe('10.42.7.12:/finanse/zestawienia/2026 >');
  expect(s.srv.seen).toContain('/finanse/zestawienia/2026');
  const r = runLine(s, 'info zestawienie_oddzialow_2026_v2.xlsx');
  expect(txt(r)).toContain('<span class="d">zatwierdził </span><span class="c">J. Nowak (dyr. finansowy)</span>');
  expect(txt(r)).toContain('przyjęte uchwałą zarządu 14/2026');
  expect(r.state.srv.known).toContain('zestawienie_oddzialow_2026_v2.xlsx');
});
test('cat: treść przez esc, auth.log z wierszy srv.log, podgląd w mc', () => {
  const s = at(onBank(), '/it');
  expect(txt(runLine(s, 'cat README.txt'))).toContain('<span class="d">── README.txt ──</span>\nLogi logowań: /it/logi/auth.log');
  const log = txt(runLine(at(onBank(), '/it/logi'), 'cat auth.log'));
  expect(log).toContain('czw 07:58  a.wisniewska  10.42.7.5    logowanie OK');
  expect(log).toContain('10.42.0.250  dostęp do serwera plików');
  const m = runLine(runLine(s, 'mc').state, 'cat README.txt').state;
  expect(m.srv.mc).toEqual({ open: true, preview: '/it/README.txt' });
});
test('zła ścieżka i HTML: bez kosztu', () => {
  const s = onBank();
  for (const [c, out] of [['cd /nie/ma', 'cd: nie ma katalogu /nie/ma'], ['cat finanse', 'Nie ma pliku „finanse” w /.'],
    ['info <b>x', 'Nie ma pliku „&lt;b&gt;x” w /.'], ['info', 'Podaj plik, np. info nazwa.xlsx']] as const) {
    const r = runLine(s, c); expect(txt(r)).toContain(out); expect(txt(r)).not.toContain('Sprawdź'); expect(tr(r.state)).toBe(tr(s));
  }
  const up = runLine(s, 'cd ..');
  expect(up.state.terminal.location).toMatchObject({ path: '/' });
  expect(tr(up.state) - tr(s)).toBeCloseTo(2);
  expect(txt(runLine(s, 'cd /nie/<i>'))).toContain('cd: nie ma katalogu /nie/&lt;i&gt;');
});
test('polecenie przy 99%: zerwanie zamiast wykonania', () => {
  const r = runLine(onBank({ trace: 99 }), 'cd finanse');
  expect(r.state.terminal.location).toEqual({ kind: 'S1' });
  expect(r.state.srv.seen).not.toContain('/finanse');
  expect(r.state.terminal.location).not.toMatchObject({ path: '/finanse' });
  expect(r.state.srv.trace).toBe(100);
  expect(txt(runLine(at(onBank({ trace: 99 }), '/it'), 'cat README.txt'))).not.toContain('README.txt ──');
});
test('poza serwerem', () => {
  expect(txt(runLine(found(), 'cd finanse'))).toContain('<span class="r">cd działa na serwerze.</span>');
  expect(txt(runLine(found(), 'mc'))).toContain('<span class="r">mc pokazuje pliki serwera.</span>');
  expect(txt(runLine(found(), 'info x'))).toContain('Nie jesteś na serwerze z plikami.');
  expect(txt(runLine(found(), 'cat x'))).toContain('Nie jesteś na serwerze.');
  for (const c of ['cd finanse', 'mc']) expect(txt(runLine(found(), c))).not.toContain('Najpierw');
});
test('edit i rm na zwykłym pliku: odmowa', () => {
  const s = at(onBank(), '/it');
  expect(txt(runLine(s, 'edit README.txt'))).toContain('edit: README.txt jest tylko do odczytu dla twojego konta.');
  expect(txt(runLine(s, 'rm README.txt'))).toContain('rm: brak uprawnień do README.txt.');
});
test('status na serwerze: druga linia', () => {
  const s = runLine(onBank(), 'cd finanse').state;
  expect(txt(runLine(s, 'status'))).toContain('\n<span class="c">Na serwerze 10.42.7.12</span> · katalog /finanse · namierzanie 2%');
  expect(txt(runLine(found(), 'status'))).not.toContain('Na serwerze');
});
test('disconnect: serwer → S1 → dom', () => {
  const a = runLine(withSrv(onBank(), { mc: { open: true, preview: null } }), 'disconnect');
  expect(a.state.terminal.location).toEqual({ kind: 'S1' });
  expect(txt(a)).toContain('Rozłączono z 10.42.7.12.</span> <span class="d">Namierzanie opada. PODSŁUCH-1 nadal online.');
  expect(a.state.srv.mc.open).toBe(false);
  expect(a.state.mission.w.disc).toBe(true);
  expect(a.state.gains.some(g => g.why === 'pobranie i czyste rozłączenie')).toBe(false);
  expect(runLine(a.state, 'disconnect').state.terminal.location).toEqual({ kind: 'home' });
});
