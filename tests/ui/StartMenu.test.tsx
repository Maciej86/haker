// @vitest-environment jsdom
import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { Desktop } from '../../src/screens/desktop/Desktop';
import type { Store } from '../../src/engine/store';
import { renderWithStore } from './helpers';

let store: Store;
beforeEach(async () => {
  ({ store } = renderWithStore(<Desktop />));
  await userEvent.click(screen.getByRole('button', { name: '≡ Start' }));
});

it('menu Ustawienia', () => {
  expect(screen.getByRole('dialog', { name: 'Ustawienia' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Fosfor/ })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: /Fosfor/ })).toHaveTextContent('Domyślny');
  expect(screen.queryByText('Podgląd: odblokuj wszystkie motywy')).toBeNull();
});
it('Neon zablokowany w nowej grze', () => {
  const neon = screen.getByRole('button', { name: /Neon/ });
  expect(neon).toBeDisabled(); expect(neon).toHaveTextContent('Ukończ misję 1'); expect(neon).toHaveTextContent('🔒');
});
it('po misji 1 Neon do wyboru i zapamiętany', async () => {
  act(() => store.apply({ ...store.get(), done: ['kuba'] }));
  const neon = screen.getByRole('button', { name: /Neon/ }); expect(neon).toHaveTextContent('Nagroda za misję 1');
  await userEvent.click(neon);
  expect(document.documentElement.dataset.theme).toBe('neon'); expect(localStorage.getItem('neonos-theme')).toBe('neon');
  expect(neon).toHaveAttribute('aria-pressed', 'true'); expect(neon).toHaveTextContent('✓');
});
it('przełącznik podpowiedzi', async () => {
  await userEvent.click(screen.getByLabelText('Podpowiedzi „co teraz” w karcie Postęp zlecenia'));
  expect(localStorage.getItem('neonos-coach')).toBe('off');
});
it('Zagraj od nowa z potwierdzeniem', async () => {
  act(() => store.apply({ ...store.get(), money: 999 }));
  await userEvent.click(screen.getByRole('button', { name: 'Zagraj od nowa' }));
  expect(screen.getByText('Zacząć od nowa? Postęp tej gry zniknie. Motywy i osiągnięcia zostają.')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Anuluj' })); expect(store.get().money).toBe(999);
  await userEvent.click(screen.getByRole('button', { name: 'Zagraj od nowa' }));
  await userEvent.click(screen.getByRole('button', { name: 'Tak, od nowa' }));
  expect(store.get()).toMatchObject({ money: 100, done: [] });
  expect(screen.getByRole('region', { name: 'Terminal' })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Poczta' })).toBeInTheDocument();
  expect(screen.queryByRole('dialog', { name: 'Ustawienia' })).toBeNull();
});
it('zamykanie: ponowny Start albo klik poza menu', async () => {
  await userEvent.click(screen.getByRole('button', { name: '≡ Start' }));
  expect(screen.queryByRole('dialog', { name: 'Ustawienia' })).toBeNull();
  await userEvent.click(screen.getByRole('button', { name: '≡ Start' }));
  fireEvent.pointerDown(screen.getByRole('dialog', { name: 'Ustawienia' }));
  expect(screen.getByRole('dialog', { name: 'Ustawienia' })).toBeInTheDocument();
  fireEvent.pointerDown(document.body);
  expect(screen.queryByRole('dialog', { name: 'Ustawienia' })).toBeNull();
});
it('przycisk deszczu', async () => {
  expect(screen.getByRole('button', { name: '☂ Deszcz' })).toHaveAttribute('aria-pressed', 'true');
  await userEvent.click(screen.getByRole('button', { name: '☂ Deszcz' }));
  expect(screen.getByRole('button', { name: '☂ Deszcz' })).toHaveAttribute('aria-pressed', 'false');
  expect(localStorage.getItem('neonos-rain')).toBe('off');
  expect(document.querySelector('canvas#rain')).not.toBeNull();
});
