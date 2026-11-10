import { test, expect } from 'vitest';
import { newGame, serialize, deserialize, interruptOnLoad } from '../../src/engine/state';
import { game, withMission } from './fixtures';

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
  const restore = withMission('kuba', { interrupt: s => ({ ...s, sec: 0 }) });
  const n = interruptOnLoad(game({ active: 'kuba', sec: 30 }));
  expect(n.sec).toBe(0);
  expect(n.terminal.lines.at(-1)).toEqual({ html: '<span class="r">połączenie przerwane</span>' });
  restore();
});
test('interruptOnLoad: zapis z ekranu wyjazdu wraca na pulpit', () => {
  expect(interruptOnLoad(game({ screen: 'trip' })).screen).toBe('desktop');
});
