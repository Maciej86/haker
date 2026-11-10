import { afterEach, expect, test } from 'vitest';
import type { GameState, Location } from '../../src/engine/types';
import { step } from '../../src/engine/types';
import { historyNav, parseLine, promptFor, runLine } from '../../src/engine/terminal';
import { game, withMission } from './fixtures';

let restore: (() => void) | undefined;
afterEach(() => { restore?.(); restore = undefined; });

const htmls = (s: GameState) => s.terminal.lines.map(l => l.html);

test('parseLine dzieli po białych znakach', () => {
  expect(parseLine('  connect   83.21.40.17 ')).toEqual({ cmd: 'connect', args: ['83.21.40.17'] });
  expect(parseLine('ls\t-a')).toEqual({ cmd: 'ls', args: ['-a'] });
  expect(parseLine('   ')).toBeNull();
});
test('promptFor w każdym miejscu', () => {
  const at = (location: Location) => promptFor(game({ terminal: { lines: [], history: [], location } }));
  expect(at({ kind: 'home' })).toBe('>');
  expect(at({ kind: 'S1' })).toBe('S1 >');
  expect(at({ kind: 'host', ip: '83.21.40.17', path: '~', via: 'direct' })).toBe('zenek:~ >');
  expect(at({ kind: 'host', ip: '10.42.7.12', path: '/finanse', via: 'S1' })).toBe('10.42.7.12:/finanse >');
});
test('echo, historia i wynik polecenia', () => {
  const r = runLine(game(), '  whoami ');
  expect(htmls(r.state).at(-1)).toBe('<span class="c">&gt;</span> whoami');
  expect(r.state.terminal.history).toEqual(['whoami']);
  expect(r.lines).toEqual([{ html: 'ghost' }]);
});
test('puste wejście: samo echo, bez historii', () => {
  const r = runLine(game(), '   ');
  expect(htmls(r.state).at(-1)).toBe('<span class="c">&gt;</span> ');
  expect(r.state.terminal.history).toEqual([]); expect(r.lines).toEqual([]);
});
test('nieznane polecenie i HTML w wejściu', () => {
  expect(runLine(game(), 'foo bar').lines).toEqual([{ html: 'foo: nie znaleziono polecenia. Wpisz help.' }]);
  const r = runLine(game(), '<img src=x onerror=alert(1)>');
  expect(r.lines[0].html).toBe('&lt;img: nie znaleziono polecenia. Wpisz help.');
  expect(htmls(r.state).at(-1)).toBe('<span class="c">&gt;</span> &lt;img src=x onerror=alert(1)&gt;');
});
test.each(['toString', 'constructor', '__proto__', 'hasOwnProperty'])('%s to nie polecenie', c => {
  expect(runLine(game(), c).lines[0].html).toBe(`${c}: nie znaleziono polecenia. Wpisz help.`);
});
test('polecenie misji ma pierwszeństwo, gdy misja jest w centrum uwagi', () => {
  restore = withMission('kuba', { commands: { whoami: (_a, s) => step(s, [{ html: 'zenek' }]) } });
  expect(runLine(game(), 'whoami').lines).toEqual([{ html: 'zenek' }]);
  const thu = game({ day: 'czw', done: ['kuba'], mail: { ...game().mail, hidden: [] } });
  expect(runLine(thu, 'whoami').lines).toEqual([{ html: 'ghost' }]);
});
test('argumenty trafiają do polecenia', () => {
  let got: string[] = [];
  restore = withMission('kuba', { commands: { connect: (a, s) => { got = a; return step(s); } } });
  runLine(game(), 'connect 83.21.40.17 extra');
  expect(got).toEqual(['83.21.40.17', 'extra']);
});
test('historia obcięta do 200 i nawigacja strzałkami', () => {
  let s = game(); for (let i = 0; i < 205; i++) s = runLine(s, 'whoami').state;
  expect(s.terminal.history).toHaveLength(200);
  const h = ['a', 'b'];
  expect(historyNav(h, 2, 'up')).toEqual({ index: 1, value: 'b' });
  expect(historyNav(h, 0, 'up')).toEqual({ index: 0, value: 'a' });
  expect(historyNav(h, 1, 'down')).toEqual({ index: 2, value: '' });
  expect(historyNav(h, 2, 'down')).toEqual({ index: 2, value: '' });
});
test('runLine nie mutuje wejścia', () => {
  const s = game(); const n = s.terminal.lines.length;
  runLine(s, 'whoami'); expect(s.terminal.lines).toHaveLength(n); expect(s.terminal.history).toEqual([]);
});
