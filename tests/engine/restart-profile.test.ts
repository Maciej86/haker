import '../../src/missions';
import { expect, test } from 'vitest';
import type { GameState } from '../../src/engine/types';
import { createStore } from '../../src/engine/store';
import { loadProfile } from '../../src/engine/profile';
import { SAVE_KEY, deserialize, newGame } from '../../src/engine/state';
import { memStorage } from './fixtures';
import { cleanBack, report } from '../missions/m3/helpers';

test('Zagraj od nowa czyści zapis, a motywy w profilu zostają', () => {
  const st = memStorage(); const pre: GameState = { ...cleanBack(), done: ['kuba', 'w'] };
  const store = createStore(pre, { persist: st }); store.apply(report(pre)); // profil zapisuje się przy wzroście done.length (plan 01)
  expect(loadProfile(st).themes).toEqual(expect.arrayContaining(['fosfor', 'neon', 'bursztyn', 'halo']));
  store.apply(newGame(2));
  expect(deserialize(st.getItem(SAVE_KEY))).toMatchObject({ done: [], day: 'śr', active: null });
  expect(loadProfile(st).themes).toContain('halo');
});
