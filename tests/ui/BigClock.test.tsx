// @vitest-environment jsdom
import '../../src/missions';
import '../../src/apps/clock/register';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { BigClock, ClockApp } from '../../src/apps/clock/BigClock';
import { APPS, visibleIcons } from '../../src/apps/registry';
import { slots } from '../../src/screens/desktop/slots';
import { m3StartState } from '../../src/missions/m3/dev';
import { atT, cams, home, run } from '../missions/m3/helpers';
import { renderWithStore } from './helpers';

afterEach(cleanup);

test('zegar na pulpicie, przycisk przewija', () => {
  const { store } = renderWithStore(<BigClock />, atT(home(cams()), 1200));
  expect(screen.getByRole('timer')).toHaveTextContent('20:00:00');
  expect(screen.getByRole('timer').className).not.toContain('live');
  fireEvent.click(screen.getByRole('button', { name: '⏩ Przewiń do 21:10' }));
  expect(store.get().t).toBe(1270);
  expect(screen.getByRole('timer').className).toContain('live');
});
test('blokada bez przycisku; poza misją pusto; slot zarejestrowany', () => {
  renderWithStore(<BigClock />, run(atT(cams(), 1210), 'cam off 10.42.5.31').state);
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.getByText(/Najpierw włącz kamery/)).toBeInTheDocument();
  cleanup(); renderWithStore(<BigClock />, m3StartState());
  expect(screen.queryByRole('timer')).toBeNull();
  expect(slots('desktop').map(x => x.id)).toContain('bigclock');
  expect(visibleIcons(cams())).toEqual(expect.arrayContaining(['plan', 'clock']));   // ikona Zegara przy aktywnym zleceniu L.
  expect(visibleIcons(m3StartState())).not.toContain('clock');
});
test('aplikacja Zegar: w oknie, a poza zleceniem z oknem czasowym tekst', () => {
  expect(APPS.clock.component).toBe(ClockApp);
  renderWithStore(<ClockApp />, atT(home(cams()), 1200));
  expect(screen.getByRole('timer')).toHaveTextContent('20:00:00');
  expect(screen.getByRole('timer').id).toBe('');
  cleanup(); renderWithStore(<ClockApp />, m3StartState());
  expect(screen.getByText('Zegar pojawi się w zleceniu z oknem czasowym.')).toBeInTheDocument();
});
