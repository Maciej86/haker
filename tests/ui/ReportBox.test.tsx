// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { DeliveryBox } from '../../src/apps/mail/DeliveryBox';
import { renderWithStore } from './helpers';
import { cleanBack } from '../missions/m3/helpers';

test('pole raportu w Poczcie: sam tekst, 1 min gry, wysłanie kończy zlecenie', () => {
  const { store } = renderWithStore(<DeliveryBox id="m3" />, cleanBack());
  expect(screen.getByRole('textbox')).toHaveValue('Zrobione. Kamery posprzątane.');
  expect(screen.getByText('1 min gry')).toBeInTheDocument();
  expect(screen.queryByText('Załącznik z folderu Pobrane:')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Wyślij raport' }));
  expect(store.get()).toMatchObject({ overlay: 'summary', active: null });
});
