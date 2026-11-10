import { afterEach, expect, it, vi } from 'vitest';
import { HW_ITEMS, NET_ITEMS, DARK_ITEMS, buy, toolsCount, registerBuyHandler } from '../../src/engine/shop';
import { step } from '../../src/engine/types';
import type { GameState } from '../../src/engine/types';
import { fmt } from '../../src/engine/text';
import { game, withMission } from './fixtures';

let restore = () => {};
afterEach(() => restore());

it('ceny i kolejność', () => {
  expect(HW_ITEMS.map(i => [i.id, i.price])).toEqual([['cpu1', 0], ['cpu2', 1100], ['cpu3', 6800], ['ram16', 700]]);
  expect(NET_ITEMS.map(i => [i.id, i.price])).toEqual([['net2', 0], ['net100', 450], ['net1000', 1800]]);
  expect(DARK_ITEMS.map(i => [i.id, i.price, !!i.multi])).toEqual([['wyt', 100, false], ['pods', 150, true], ['v1', 900, false], ['v2', 1400, false], ['v3', 2200, false]]);
});
it('kupno procesora', () => {
  const r = buy(game({ money: 1200 }), 'cpu2');
  expect(r.state).toMatchObject({ money: 100, hw: { cpu: 3.6 } });
  expect(r.state.owned).toContain('cpu2'); expect(r.state.stats.buys).toBe(1);
  expect(r.ui).toContainEqual({ kind: 'toast', text: 'Kupiono: Ryzen 5 Neon' });
});
it('łącze zmienia nazwę', () => { expect(buy(game({ money: 450 }), 'net100').state.hw).toMatchObject({ net: 100, netName: 'Światłowód' }); });
it('bez pieniędzy: bez zmian i komunikat', () => {
  const s = game(); const r = buy(s, 'cpu2');
  expect(r.state).toBe(s);
  expect(r.ui).toEqual([{ kind: 'toast', text: `Brakuje ${fmt(1000)} ¤ na Ryzen 5 Neon`, bad: true }]);
});
it('jednorazowej rzeczy nie da się kupić drugi raz', () => {
  const once = buy(game({ money: 300 }), 'wyt').state; const twice = buy(once, 'wyt');
  expect(twice.state).toBe(once); expect(twice.ui).toEqual([]);
});
it('Wytrych wypisuje linię instalacji', () => { expect(buy(game({ money: 100 }), 'wyt').lines[0].html).toContain('Zainstalowano: Wytrych 1.0'); });
it('PODSŁUCH-1 wiele razy, bez owned', () => {
  const r = buy(buy(game({ money: 300 }), 'pods').state, 'pods');
  expect(r.state.money).toBe(0); expect(r.state.owned).not.toContain('pods'); expect(r.state.stats.buys).toBe(2);
});
it('onBuy misji z centrum uwagi', () => {
  const spy = vi.fn((s: GameState) => step(s, [{ html: 'misja' }]));
  restore = withMission('kuba', { onBuy: spy });
  const r = buy(game({ money: 100, active: 'kuba' }), 'wyt');
  expect(spy).toHaveBeenCalledWith(expect.anything(), 'wyt'); expect(r.lines.map(l => l.html)).toContain('misja');
});
it('registerBuyHandler: po pobraniu ceny, przed onBuy', () => {
  const order: string[] = [];
  registerBuyHandler('v1', s => { order.push(`h:${s.money}`); return step(s, [{ html: 'handler' }]); });
  restore = withMission('kuba', { onBuy: (s: GameState) => { order.push('onBuy'); return step(s); } });
  const r = buy(game({ money: 1000, active: 'kuba' }), 'v1');
  expect(order).toEqual(['h:100', 'onBuy']); expect(r.lines.map(l => l.html)).toContain('handler');
  expect(r.state.owned).toContain('v1');
});
it('toolsCount', () => { expect(toolsCount(game({ owned: ['cpu1', 'net2', 'wyt', 'v2'] }))).toBe(2); });
it('nieznany identyfikator', () => { const s = game(); expect(buy(s, 'xyz').state).toBe(s); });
