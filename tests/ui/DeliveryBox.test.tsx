// @vitest-environment jsdom
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { DeliveryBox } from '../../src/apps/mail/DeliveryBox';
import { Mail } from '../../src/apps/mail/Mail';
import { renderWithStore } from './helpers';
import { kubaAccepted, withKuba, run } from '../missions/kuba/helpers';

const withFiles = (...names: string[]) =>
  run(withKuba({ ...kubaAccepted(), owned: ['cpu1', 'net2', 'wyt'] }, { conn: true, cracked: true }),
    'connect 83.21.40.17', ...names.map(n => `get ${n}`), 'disconnect').state;

it('pusto: podpowiedź, nieaktywny Wyślij, koszt', () => {
  renderWithStore(<DeliveryBox id="kuba" />, kubaAccepted());
  expect(screen.getByText('Odpowiedz Kubie')).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Odpowiedz Kubie' })).toHaveValue('Proszę bardzo.');
  expect(screen.getByText('Załącznik z folderu Pobrane:')).toBeInTheDocument();
  expect(screen.getByText('pusto: pobierz plik z serwera Zenka (get)')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Wyślij' })).toBeDisabled();
  expect(screen.getByText('1 min gry')).toBeInTheDocument();
});
it('zły plik: wątek z żartem, wybór chipu znika', async () => {
  const { store } = renderWithStore(<DeliveryBox id="kuba" />, withFiles('przepis_na_paczki.txt', 'playlista.txt'));
  const chip = screen.getByRole('button', { name: '📎 przepis_na_paczki.txt' });
  expect(chip).toHaveAttribute('aria-pressed', 'false');
  await userEvent.click(chip);
  expect(chip).toHaveClass('on'); expect(chip).toHaveAttribute('aria-pressed', 'true');
  await userEvent.click(screen.getByRole('button', { name: 'Wyślij' }));
  expect(store.get().mail.threads.kuba.at(-1)).toMatchObject({ bad: true });
  expect(screen.getByRole('button', { name: 'Wyślij' })).toBeDisabled();
});
it('playlista kończy misję, tekst gracza escapowany', async () => {
  const { store } = renderWithStore(<DeliveryBox id="kuba" />, withFiles('playlista.txt'));
  const ta = screen.getByRole('textbox'); await userEvent.clear(ta); await userEvent.type(ta, '<b>gruby</b>');
  await userEvent.click(screen.getByRole('button', { name: '📎 playlista.txt' }));
  await userEvent.click(screen.getByRole('button', { name: 'Wyślij' }));
  const s = store.get();
  expect(s.done).toContain('kuba'); expect(s.overlay).toBe('summary');
  expect(s.mail.threads.kuba.find(m => m.from === 'Ty' && m.attachment === 'playlista.txt')!.html).toBe('&lt;b&gt;gruby&lt;/b&gt;');
});
it('Poczta: nagłówek przyjęcia z delivery.title; pole oddania tylko przy canDeliver', async () => {
  const { unmount } = renderWithStore(<Mail />);
  expect(screen.getByText('Odpowiedz Kubie')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Wyślij' })).toBeNull();
  unmount();
  const { store } = renderWithStore(<Mail />, withFiles('playlista.txt'));
  await userEvent.click(screen.getByRole('button', { name: '📎 playlista.txt' }));
  await userEvent.click(screen.getByRole('button', { name: 'Wyślij' }));
  expect(store.get().done).toContain('kuba');
  expect(screen.queryByRole('button', { name: 'Wyślij' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Zakończone' })).toBeDisabled();
});
