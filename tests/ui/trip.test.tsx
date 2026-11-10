// @vitest-environment jsdom
import { test, expect, afterEach } from 'vitest';
import { fireEvent, screen, waitFor, cleanup } from '@testing-library/react';
import Trip from '../../src/screens/trip/Trip';
import { newGame } from '../../src/engine/state';
import { SAMPLE_TRIP } from '../../src/world/trip/sample';
import { withMission } from '../engine/fixtures';
import { renderWithStore } from './helpers';

let restore = () => {};
afterEach(() => { restore(); cleanup(); });
const onTrip = (money: number) => {
  restore = withMission('w', { trip: SAMPLE_TRIP });
  return { ...newGame(1), done: ['kuba' as const], day: 'czw' as const, t: 848, money, active: 'w' as const,
    screen: 'trip' as const, mapCityTab: 'poznan' as const, mapCityDistrict: 'centrum' };
};

test('za mało ¤: opcja wyszarzona z dopiskiem i nieklikalna', async () => {
  const { container } = renderWithStore(<Trip />, onTrip(50));
  await waitFor(() => expect(container.querySelector('.opt[data-k="ic"]')).toBeTruthy());
  const ic = container.querySelector('.opt[data-k="ic"]')!;
  expect(ic.classList.contains('off')).toBe(true);
  expect(ic.textContent).toContain('za mało ¤');
  expect(container.querySelector('.opt[data-k="regio"]')!.classList.contains('off')).toBe(false);
  fireEvent.click(ic);
  expect(ic.classList.contains('on')).toBe(false);
  expect((screen.getByRole('button', { name: 'Jedź' }) as HTMLButtonElement).disabled).toBe(false);
});
test('za mało ¤ na każdy środek: „Jedź” wyłączony', async () => {
  const { container, store } = renderWithStore(<Trip />, onTrip(20));
  await waitFor(() => expect(container.querySelectorAll('.opt.off')).toHaveLength(3));
  const go = screen.getByRole('button', { name: 'Jedź' }) as HTMLButtonElement;
  expect(go.disabled).toBe(true);
  fireEvent.click(go);
  expect(screen.queryByText('Dziennik wyjazdu')).toBeNull();
  expect(store.get().money).toBe(20);
});
test('Anuluj wraca do Centrum bez kosztów', async () => {
  const { store } = renderWithStore(<Trip />, onTrip(400));
  await waitFor(() => screen.getByRole('button', { name: 'Anuluj' }));
  fireEvent.click(screen.getByRole('button', { name: 'Anuluj' }));
  expect(store.get()).toMatchObject({ screen: 'mapCity', mapCityDistrict: 'centrum', money: 400, t: 848 });
});
