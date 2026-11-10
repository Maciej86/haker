// @vitest-environment jsdom
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { Wytrych } from '../../src/apps/wytrych/Wytrych';
import { WYTRYCH_MODES } from '../../src/apps/wytrych/modes';
import { BakePanel } from '../../src/apps/wytrych/BakePanel';
import { APPS } from '../../src/apps/registry';
import { runLine } from '../../src/engine/terminal';
import { bakeAnswer } from '../../src/missions/kuba/logic';
import { kubaAccepted } from '../missions/kuba/helpers';
import { Probe, renderWithStore } from './helpers';

const start = () => ({ ...kubaAccepted(3), owned: ['cpu1', 'net2', 'wyt'] });

it('rejestracja: komponent, tytuł z widoku, tryb wypieków w rejestrze', () => {
  expect(APPS.wytrych.component).toBe(Wytrych);
  expect(APPS.wytrych.winTitle!(start())).toBe('Wytrych 1.0 · 83.21.40.17 (serwer Zenka)');
  expect(WYTRYCH_MODES.bake).toBe(BakePanel);
});

it('Brak celu bez crack, wypieki po crack, zła odpowiedź pokazuje komunikat', async () => {
  const user = userEvent.setup();
  const { store, container } = renderWithStore(<Wytrych />, start());
  expect(screen.getByText('Brak celu.')).toBeInTheDocument();
  act(() => store.apply(runLine(store.get(), 'crack 83.21.40.17')));
  const inp = screen.getByLabelText('Hasło: wynik ostatniego równania');
  expect(inp).toHaveFocus();
  expect(inp).toHaveAttribute('maxLength', '3');
  expect(container.querySelectorAll('.eq')).toHaveLength(4);
  expect(container.querySelectorAll('.eq svg[aria-label="chleb"]').length).toBeGreaterThan(0);
  await user.type(inp, '0{Enter}');
  expect(screen.getByText('Złe hasło (0). Policz jeszcze raz.')).toBeInTheDocument();
  expect(screen.getByText('prób: 1')).toBeInTheDocument();
  expect(inp).toHaveValue('0');
  expect(container.querySelector('.eqs')).toHaveClass('shake');
  await user.click(screen.getByRole('button', { name: 'Pokaż podpowiedź · za darmo' }));
  expect(screen.getByText(/Pierwsze równanie ma same chleby/)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Następna podpowiedź · za darmo' }));
  await user.click(screen.getByRole('button', { name: 'Następna podpowiedź · za darmo' }));
  expect(container.querySelectorAll('.hintk')).toHaveLength(3);
  expect(screen.queryByRole('button', { name: /podpowiedź · za darmo/ })).toBeNull();
  expect(store.get().mission.kuba.tries).toBe(1);
});

it('puste pole nic nie robi; dobre hasło: karta wyniku i ls do Terminala', async () => {
  const user = userEvent.setup();
  const { store, container } = renderWithStore(<><Probe /><Wytrych /></>, start());
  act(() => store.apply(runLine(store.get(), 'crack 83.21.40.17')));
  await user.click(screen.getByRole('button', { name: 'Wpisz hasło ›' }));
  expect(store.get().mission.kuba.tries).toBe(0);
  const n = bakeAnswer(store.get().mission.kuba.bake!);
  await user.type(screen.getByLabelText('Hasło: wynik ostatniego równania'), String(n));
  await user.click(screen.getByRole('button', { name: 'Wpisz hasło ›' }));
  expect(screen.getByText(`Hasło złamane: ${n}`)).toBeInTheDocument();
  expect(screen.getByText('Jesteś na serwerze Zenka.')).toBeInTheDocument();
  expect(container.querySelector('.eqs')).toHaveClass('won');
  const inp = screen.getByLabelText('Hasło: wynik ostatniego równania');
  expect(inp).toBeDisabled(); expect(inp).toHaveValue(String(n));
  await user.click(screen.getByRole('button', { name: 'Lista plików (ls) ›' }));
  expect(screen.getByTestId('input')).toHaveTextContent('ls');
});
