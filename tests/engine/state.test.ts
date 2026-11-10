import { test, expect, afterEach } from 'vitest';
import { newGame, serialize, deserialize, interruptOnLoad } from '../../src/engine/state';
import { game, withMission } from './fixtures';

let restore: (() => void) | undefined;
afterEach(() => { restore?.(); restore = undefined; });

test('newGame: stan startowy misji Kuby', () => {
  const s = newGame(5);
  expect(s).toMatchObject({ version: 1, seed: 5, day: 'śr', t: 1230, money: 100, xp: 40, lvl: 1,
    skills: { 'Sieć': 1.6, 'Linux': 1.5, 'Skrypty': 0, 'Social': 1 }, owned: ['cpu1', 'net2'],
    hw: { cpu: 1.1, ram: 4, net: 2, netName: 'ADSL' }, active: null, done: [], screen: 'desktop', overlay: null });
  expect(s.mail.hidden).toEqual(['w', 'm3']);
  expect(s.terminal.lines.map(l => l.html)).toEqual([
    '<span class="c">NeonOS 0.4</span>',
    '<span class="d">śr 20:30 · w Poczcie czeka wiadomość od Kuby.</span>', '']);
  expect(s.terminal.location).toEqual({ kind: 'home' });
});
test('zapis i odczyt dają ten sam stan', () => {
  const s = game({ money: 777, done: ['kuba'] });
  expect(deserialize(serialize(s))).toEqual(s);
});
test.each([[null], ['{zepsute'], ['[]'], ['42'], [JSON.stringify({ ...newGame(1), version: 2 })],
  [JSON.stringify({ ...newGame(1), day: 'xyz' })]])('deserialize(%s) → null', raw => {
  expect(deserialize(raw as string | null)).toBeNull();
});
test('interruptOnLoad: nic w toku → ten sam obiekt', () => {
  const s = game(); expect(interruptOnLoad(s)).toBe(s);
});
test('interruptOnLoad: misja przerywa czynność i Terminal dopisuje linię', () => {
  restore = withMission('kuba', { interrupt: s => ({ ...s, sec: 0 }) });
  const n = interruptOnLoad(game({ active: 'kuba', sec: 30 }));
  expect(n.sec).toBe(0);
  expect(n.terminal.lines.at(-1)).toEqual({ html: '<span class="r">połączenie przerwane</span>' });
});
test('interruptOnLoad: zapis z ekranu wyjazdu wraca na pulpit', () => {
  expect(interruptOnLoad(game({ screen: 'trip' })).screen).toBe('desktop');
});
test('deserialize odrzuca zapisy o złym kształcie', () => {
  const real = JSON.parse(serialize(newGame(1)));
  const { mail: _m, ...noMail } = real;
  expect(deserialize('{"version":1,"t":5,"day":"śr"}')).toBeNull();
  expect(deserialize(JSON.stringify(noMail))).toBeNull();
  expect(deserialize(JSON.stringify({ ...real, skills: { ...real.skills, Linux: 9 } }))).toBeNull();
  expect(deserialize(JSON.stringify({ ...real, active: 'xyz' }))).toBeNull();
  expect(deserialize(JSON.stringify({ ...real, done: ['xyz'] }))).toBeNull();
  expect(deserialize(JSON.stringify({ ...real, screen: 'x' }))).toBeNull();
  expect(deserialize(JSON.stringify({ ...real, terminal: { ...real.terminal, lines: 1 } }))).toBeNull();
});
test('deserialize przyjmuje poprawny zapis z aktywną misją i nullami', () => {
  const s = game({ active: 'kuba', done: ['w'], overlay: 'summary', summary: [], summaryMeta: { log: [], xp: 1, money: 2, next: 'end' } });
  expect(deserialize(serialize(s))).toEqual(s);
});
