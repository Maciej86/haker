import { expect, test } from 'vitest';
import type { GameState } from '../../../src/engine/types';
import { acceptOffer, buyHint, hintView } from '../../../src/engine/missions';
import { deserialize, serialize } from '../../../src/engine/state';
import { W_HINTS } from '../../../src/missions/w/texts';
import { wStartState } from '../../../src/missions/w/dev';

const acc = (p: Partial<GameState> = {}) => ({ ...acceptOffer(wStartState(), 'w').state, ...p });

test('trzy stopnie: 15, 30, 60 ¤, bez czasu gry', () => {
  let s = acc();
  const t0 = s.t;
  expect(hintView(s)).toEqual({ shown: [], next: { n: 1, price: 15 } });
  s = buyHint(s).state; expect([s.money, s.hintsUsed, s.t]).toEqual([285, 1, t0]);
  expect(hintView(s)!.shown).toEqual([W_HINTS[0].text]);
  expect(hintView(s)!.next).toEqual({ n: 2, price: 30 });
  s = buyHint(buyHint(s).state).state; expect(s.money).toBe(195);
  expect(hintView(s)!.shown).toEqual(W_HINTS.map(h => h.text));
  expect(hintView(s)!.next).toBeNull();
  expect(buyHint(s).state).toBe(s);
  expect(deserialize(serialize(s))!.hintsUsed).toBe(3);
});
test('za mało pieniędzy: toast, nic się nie zmienia', () => {
  const s = acc({ money: 20, hintsUsed: 1 }); const r = buyHint(s);
  expect(r.state).toBe(s);
  expect(r.ui).toEqual([{ kind: 'toast', text: 'Brakuje 10 ¤ na podpowiedź', bad: true }]);
});
test('po znalezieniu celu podpowiedzi zamknięte', () => {
  const a = acc(); const s = { ...a, mission: { ...a.mission, w: { ...a.mission.w, found: true } } };
  expect(hintView(s)!.next).toBeNull(); expect(buyHint(s).state).toBe(s);
  expect(buyHint(s).ui).toEqual([]);
});
test('licznik zerowany przy przyjęciu, brak podpowiedzi bez zlecenia', () => {
  expect(acceptOffer({ ...wStartState(), hintsUsed: 2 }, 'w').state.hintsUsed).toBe(0);
  expect(hintView(wStartState())).toBeNull();
});
