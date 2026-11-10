// @vitest-environment jsdom
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { Browser } from '../../src/apps/browser/Browser';
import { Darknet } from '../../src/apps/darknet/Darknet';
import { APPS } from '../../src/apps/registry';
import { fmt } from '../../src/engine/text';
import { ToastHost } from '../../src/ui/Toast';
import { renderWithStore } from './helpers';

const rowOf = (name: string) => screen.getByRole('heading', { name }).closest('.row') as HTMLElement;

it('wpisy w APPS', () => {
  expect(APPS.browser.component).toBe(Browser);
  expect(APPS.darknet.component).toBe(Darknet);
});
it('Przeglądarka: adres, nagłówek, zakładki', async () => {
  renderWithStore(<Browser />);
  expect(screen.getByText('kiloherc.shop')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Ulepszenia' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Sprzęt' })).toHaveAttribute('aria-selected', 'true');
  expect(rowOf('Celeron N4020')).toHaveClass('owned'); expect(within(rowOf('Celeron N4020')).getByRole('button')).toHaveTextContent('Masz');
  await userEvent.click(screen.getByRole('tab', { name: 'Internet' }));
  expect(screen.getByRole('heading', { name: 'Światłowód 100 Mb/s' })).toBeInTheDocument();
});
it('za mało pieniędzy: komunikat, bez zmiany', async () => {
  const { store } = renderWithStore(<><ToastHost /><Browser /></>);
  await userEvent.click(within(rowOf('Ryzen 5 Neon')).getByRole('button', { name: 'Kup' }));
  expect(screen.getByText(`Brakuje ${fmt(1000)} ¤ na Ryzen 5 Neon`)).toBeInTheDocument(); expect(store.get().money).toBe(100);
});
it('Darknet: kupno Wytrycha, dwa kliknięcia nie pobierają dwa razy', async () => {
  const { store } = renderWithStore(<Darknet />);
  expect(screen.getByText('czarnyrynek7q')).toBeInTheDocument();
  expect(screen.getByText('Sprzedaż własnych programów odblokujesz po misji 3. Twoje narzędzia trafią na tę listę pod Twoim pseudonimem.')).toBeInTheDocument();
  await userEvent.dblClick(within(rowOf('Wytrych 1.0')).getByRole('button', { name: 'Kup' }));
  expect(store.get().money).toBe(0); expect(within(rowOf('Wytrych 1.0')).getByRole('button', { name: 'Masz' })).toBeDisabled();
  expect(within(rowOf('PODSŁUCH-1')).getByRole('button')).toHaveClass('red');
});
