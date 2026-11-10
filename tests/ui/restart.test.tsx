// @vitest-environment jsdom
import { act, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useRestart } from '../../src/ui/restart';
import { ToastHost } from '../../src/ui/Toast';
import { hideMail, useHiddenMail } from '../../src/apps/mail/delayed';
import { setTerminalInput } from '../../src/apps/terminal/input';
import { TermInputProbe, renderWithStore } from './helpers';

let restart = () => {};
let hidden: (t: string, h: string) => boolean = () => false;
function Sonda() { restart = useRestart(); hidden = useHiddenMail(); return null; }

it('nowa gra kasuje opóźnioną odpowiedź i wpisane polecenie', () => {
  vi.useFakeTimers();
  renderWithStore(<><Sonda /><ToastHost /><TermInputProbe /></>);
  const shown = vi.fn();
  act(() => { hideMail('kuba-x', 'odp', 1000, shown); setTerminalInput('connect 1.2.3.4'); });
  expect(hidden('kuba-x', 'odp')).toBe(true);
  expect(screen.getByTestId('input')).toHaveTextContent('connect 1.2.3.4');
  act(() => restart());
  expect(hidden('kuba-x', 'odp')).toBe(false);
  expect(screen.getByTestId('input')).toHaveTextContent('');
  act(() => vi.advanceTimersByTime(2000));
  expect(shown).not.toHaveBeenCalled();
});
