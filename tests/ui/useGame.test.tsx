// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { createStore } from '../../src/engine/store';
import { loadProfile } from '../../src/engine/profile';
import { StoreContext, useGame, useStore } from '../../src/ui/useGame';
import { ProfileProvider } from '../../src/ui/useProfile';
import { game, memStorage } from '../engine/fixtures';
import { renderWithStore } from './helpers';

it('useGame odświeża komponent po apply', () => {
  const Money = () => <span>{useGame(s => s.money)}</span>;
  const { store } = renderWithStore(<Money />);
  act(() => store.apply({ ...store.get(), money: 555 }));
  expect(screen.getByText('555')).toBeInTheDocument();
});
it('useStore bez dostawcy rzuca czytelny błąd', () => {
  const Bad = () => { useStore(); return null; };
  vi.spyOn(console, 'error').mockImplementation(() => {});
  expect(() => render(<Bad />)).toThrow('StoreContext: brak magazynu');
});
it('profil zapisuje osiągnięcie i motyw po ukończeniu misji', () => {
  const st = memStorage(); const store = createStore(game(), { persist: null });
  render(<StoreContext.Provider value={store}><ProfileProvider storage={st}><i /></ProfileProvider></StoreContext.Provider>);
  act(() => store.apply({ ...store.get(), done: ['kuba'] }));
  expect(loadProfile(st).achievements).toContain('kuba'); expect(loadProfile(st).themes).toContain('neon');
});
it('zablokowany motyw z localStorage nie wchodzi przy starcie', () => {
  localStorage.setItem('neonos-theme', 'halo');
  render(<StoreContext.Provider value={createStore(game(), { persist: null })}><ProfileProvider storage={memStorage()}><i /></ProfileProvider></StoreContext.Provider>);
  expect(document.documentElement.dataset.theme).toBe('fosfor');
});
