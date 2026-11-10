import { test, expect } from 'vitest';
import { loadProfile, saveProfile, unlockedThemes, mergeProfile } from '../../src/engine/profile';
import { game, memStorage } from './fixtures';

test('profil domyślny i odporny na śmieci', () => {
  expect(loadProfile(null)).toEqual({ themes: ['fosfor'], achievements: [] });
  const st = memStorage(); st.setItem('neonos-profile', '{zepsute');
  expect(loadProfile(st)).toEqual({ themes: ['fosfor'], achievements: [] });
});
test.each([['null'], ['[]'], ['42'], ['{}'], ['{"themes":["neon"]}'], ['{"themes":"x","achievements":[]}']])(
  'profil z poprawnego JSON o złym kształcie (%s) → domyślny', raw => {
    const st = memStorage(); st.setItem('neonos-profile', raw);
    expect(loadProfile(st)).toEqual({ themes: ['fosfor'], achievements: [] });
  });
test('unlockedThemes wg liczby misji', () => {
  expect(unlockedThemes(0)).toEqual(['fosfor']);
  expect(unlockedThemes(1)).toEqual(['fosfor', 'neon']);
  expect(unlockedThemes(3)).toEqual(['fosfor', 'neon', 'bursztyn', 'halo']);
});
test('mergeProfile i zapis', () => {
  const st = memStorage();
  saveProfile(st, mergeProfile(loadProfile(st), game({ done: ['kuba'] })));
  expect(loadProfile(st).themes).toEqual(['fosfor', 'neon']);
  expect(() => saveProfile(memStorage({ failWrites: true }), loadProfile(null))).not.toThrow();
});
