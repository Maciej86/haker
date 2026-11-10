import { expect, it } from 'vitest';
import { bootGame } from '../../src/boot';
import { SAVE_KEY, serialize } from '../../src/engine/state';
import { game, memStorage } from '../engine/fixtures';

it('pusta pamięć: nowa gra', () => {
  const { store, fresh } = bootGame(memStorage());
  expect(fresh).toBe(true); expect(store.get()).toMatchObject({ day: 'śr', t: 20 * 60 + 30 });
});
it('zapis wraca po odświeżeniu', () => {
  const st = memStorage(); st.setItem(SAVE_KEY, serialize(game({ money: 77 })));
  const { store, fresh } = bootGame(st);
  expect(fresh).toBe(false); expect(store.get().money).toBe(77);
});
it('zła wersja zapisu: nowa gra', () => {
  const st = memStorage(); st.setItem(SAVE_KEY, '{"version":0}'); expect(bootGame(st).fresh).toBe(true);
});
