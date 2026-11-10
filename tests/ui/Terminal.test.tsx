// @vitest-environment jsdom
import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { Terminal } from '../../src/apps/terminal/Terminal';
import { APPS } from '../../src/apps/registry';
import { setTerminalInput } from '../../src/apps/terminal/input';
import { registerTerminalView } from '../../src/apps/terminal/views';
import { promptFor, runLine } from '../../src/engine/terminal';
import { termMissionLabel, termStepLabel } from '../../src/engine/desktop';
import { game } from '../engine/fixtures';
import { renderWithStore } from './helpers';

it('wpis w APPS', () => { expect(APPS.terminal.component).toBe(Terminal); });
it('linie HTML i znak zachęty', () => {
  renderWithStore(<Terminal />, game({ terminal: { ...game().terminal, lines: [{ html: '<span class="c">NeonOS 0.4</span>' }] } }));
  expect(screen.getByText('NeonOS 0.4')).toHaveClass('c'); expect(screen.getByText(promptFor(game()))).toHaveClass('c');
});
it('Enter przez silnik i czyszczenie pola', async () => {
  const { store } = renderWithStore(<Terminal />); const s0 = store.get();
  await userEvent.type(screen.getByLabelText('Polecenie'), 'whoami{Enter}');
  expect(store.get().terminal.history).toEqual(runLine(s0, 'whoami').state.terminal.history);
  expect(screen.getByText('ghost')).toBeInTheDocument(); expect(screen.getByLabelText('Polecenie')).toHaveValue('');
});
it('pusta linia też idzie do silnika (samo echo)', async () => {
  const { store } = renderWithStore(<Terminal />); const n = store.get().terminal.lines.length;
  await userEvent.type(screen.getByLabelText('Polecenie'), '{Enter}');
  expect(store.get().terminal.lines).toHaveLength(n + 1); expect(store.get().terminal.history).toEqual([]);
});
it('historia strzałkami', async () => {
  renderWithStore(<Terminal />); const inp = screen.getByLabelText('Polecenie');
  await userEvent.type(inp, 'help{Enter}whoami{Enter}');
  await userEvent.keyboard('{ArrowUp}'); expect(inp).toHaveValue('whoami');
  await userEvent.keyboard('{ArrowUp}'); expect(inp).toHaveValue('help');
  await userEvent.keyboard('{ArrowDown}'); expect(inp).toHaveValue('whoami');
  await userEvent.keyboard('{ArrowDown}'); expect(inp).toHaveValue('');
});
it('pasek misji', () => {
  renderWithStore(<Terminal />);
  expect(screen.getByText('Zlecenie:')).toBeInTheDocument(); expect(screen.getByText(termMissionLabel(game()))).toBeInTheDocument();
  expect(screen.getByText(termStepLabel(game()))).toBeInTheDocument();
});
it('fokus pola przy otwarciu i po kliknięciu w Terminal', () => {
  renderWithStore(<Terminal />); const inp = screen.getByLabelText('Polecenie');
  expect(inp).toHaveFocus();
  inp.blur(); fireEvent.click(document.getElementById('term')!); expect(inp).toHaveFocus();
});
it('polecenie wpisane przyciskiem programu', () => {
  renderWithStore(<Terminal />); act(() => setTerminalInput('connect 83.21.40.17'));
  expect(screen.getByLabelText('Polecenie')).toHaveValue('connect 83.21.40.17');
  act(() => setTerminalInput(''));
});
it('aktywny widok zastępuje wnętrze', () => {
  registerTerminalView({ id: 'fake-mc', active: s => s.money === 1, component: () => <div>PANEL MC</div> });
  renderWithStore(<Terminal />, game({ money: 1 }));
  expect(screen.getByText('PANEL MC')).toBeInTheDocument(); expect(screen.queryByLabelText('Polecenie')).toBeNull();
});
