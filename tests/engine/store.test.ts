import { test, expect } from 'vitest';
import { createStore } from '../../src/engine/store';
import { deserialize, newGame } from '../../src/engine/state';
import { loadProfile } from '../../src/engine/profile';
import { step } from '../../src/engine/types';
import type { UiEvent } from '../../src/engine/types';
import { game, memStorage } from './fixtures';

test('apply dopisuje linie, emituje zdarzenia i zapisuje', () => {
  const st = memStorage(); const store = createStore(game(), { persist: st });
  const seen: UiEvent[] = []; let calls = 0;
  store.onUi(e => seen.push(e)); const off = store.subscribe(() => calls++);
  store.apply(step({ ...store.get(), money: 150 }, [{ html: 'a' }], [{ kind: 'toast', text: 'x' }]));
  expect(store.lines().at(-1)).toEqual({ html: 'a' });
  expect(seen).toEqual([{ kind: 'toast', text: 'x' }]);
  expect(calls).toBe(1);
  expect(deserialize(st.getItem('neonos-save'))!.money).toBe(150);
  off(); store.apply({ ...store.get(), money: 1 }); expect(calls).toBe(1);
});
test('apply przyjmuje gołe GameState (np. „Zagraj od nowa”)', () => {
  const store = createStore(game({ money: 5 })); store.apply(newGame(2));
  expect(store.get().money).toBe(100);
});
test('wyjazd się nie zapisuje', () => {
  const st = memStorage(); const store = createStore(game(), { persist: st });
  store.apply({ ...store.get(), money: 120 });
  store.apply({ ...store.get(), screen: 'trip', money: 50 });
  expect(deserialize(st.getItem('neonos-save'))!.money).toBe(120);
});
test('bez Storage i przy pełnym Storage nie ma wyjątku', () => {
  expect(() => createStore(game()).apply(game())).not.toThrow();
  expect(() => createStore(game(), { persist: memStorage({ failWrites: true }) }).apply(game({ money: 1 }))).not.toThrow();
});
test('Terminal trzyma najwyżej 500 linii', () => {
  const store = createStore(game());
  store.apply(step(store.get(), Array.from({ length: 600 }, (_, i) => ({ html: String(i) }))));
  expect(store.lines()).toHaveLength(500);
  expect(store.lines().at(-1)).toEqual({ html: '599' });
});
test('ukończenie misji zapisuje motyw w profilu', () => {
  const st = memStorage(); const store = createStore(game(), { persist: st });
  store.apply(game({ done: ['kuba'] }));
  expect(loadProfile(st).themes).toContain('neon');
});
test('zmiana tylko net.s1Ms nie zapisuje, zmiana t zapisuje', () => {
  const st = memStorage(); let writes = 0;
  const set = st.setItem.bind(st); st.setItem = (k, v) => { if (k === 'neonos-save') writes++; set(k, v); };
  const store = createStore(game(), { persist: st }); let calls = 0; store.subscribe(() => calls++);
  store.apply({ ...store.get(), money: 7 }); expect(writes).toBe(1);
  const s = store.get();
  store.apply({ ...s, net: { ...s.net, s1Ms: 3_000 } });
  store.apply({ ...store.get(), net: { ...store.get().net, s1Ms: 6_000 } });
  expect(writes).toBe(1); expect(calls).toBe(3); expect(store.get().net.s1Ms).toBe(6_000);
  store.apply({ ...store.get(), t: store.get().t + 1 });
  expect(writes).toBe(2); expect(deserialize(st.getItem('neonos-save'))!.net.s1Ms).toBe(6_000);
});
