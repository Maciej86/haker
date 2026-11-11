import { test, expect } from 'vitest';
import { buy } from '../../src/engine/shop';
import { acceptOffer } from '../../src/engine/missions';
import { afterKuba, atS1, inPack } from './netHelpers';
import { kubaAccepted } from '../missions/kuba/helpers';

test('nowy podsłuch w misji z siecią: 150 ¤, plecak, tekst', () => {
  const s = acceptOffer(afterKuba([atS1(0)]), 'w').state; const r = buy(s, 'pods');
  expect(r.state.money).toBe(s.money - 150);
  expect(r.state.devices).toContainEqual({ id: 'bug1', where: 'plecak', minutes: 60 });
  // „Trzeba go zawieźć i podpiąć w szafce przy S1.” pominięte (Terminal nie podpowiada, plan 05 Task 1).
  expect(r.lines.map(l => l.html).join('\n')).toContain('<span class="c">Kupiono PODSŁUCH-1.</span> <span class="d">Paczkomat obok domu.</span>');
  expect(r.state.stats.buys).toBe(s.stats.buys + 1);
});
test('drugi podsłuch w plecaku: bez pobrania pieniędzy', () => {
  const s = acceptOffer(afterKuba([atS1(0), inPack()]), 'w').state; const r = buy(s, 'pods');
  expect(r.state.money).toBe(s.money);
  expect(r.state.stats.buys).toBe(s.stats.buys);
  expect(r.ui).toContainEqual({ kind: 'toast', text: 'Masz już nowy PODSŁUCH-1 w plecaku.', bad: true });
});
test('u Kuby kupno podsłuchu bez tekstów o S1', () => {
  const r = buy({ ...kubaAccepted(), money: 500 }, 'pods');
  expect(r.state.devices).toEqual([{ id: 'bug1', where: 'plecak', minutes: 60 }]);
  expect(r.lines.map(l => l.html).join('\n')).not.toMatch(/S1/);
});
