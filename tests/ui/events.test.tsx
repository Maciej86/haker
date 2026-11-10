// @vitest-environment jsdom
import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { missionDef } from '../../src/engine/missions';
import { typeInTerminal } from '../../src/engine/help';
import { step } from '../../src/engine/types';
import { useHiddenMail } from '../../src/apps/mail/delayed';
import { ToastHost } from '../../src/ui/Toast';
import { withMission } from '../engine/fixtures';
import { Probe, renderWithStore } from './helpers';

let restore = () => {};
beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => restore());

it('typeInTerminal: Terminal otwarty, polecenie w polu, komunikat', () => {
  const { store } = renderWithStore(<><ToastHost /><Probe /></>);
  act(() => store.apply(typeInTerminal(store.get(), 'connect 83.21.40.17')));
  expect(screen.getByTestId('order')).toHaveTextContent('terminal');
  expect(screen.getByTestId('input')).toHaveTextContent('connect 83.21.40.17');
  expect(screen.getByText('Polecenie wpisane w Terminalu. Zatwierdź Enterem.')).toBeInTheDocument();
});
it('mailArrives: wiadomość ukryta przez delayMs, potem toast — także bez otwartej Poczty', () => {
  const Hidden = () => { const h = useHiddenMail(); return <b data-testid="h">{String(h('kuba', 'odp'))}</b>; };
  const offer = missionDef('kuba').offer;
  restore = withMission('kuba', { offer: { ...offer, giverAnswer: { ...offer.giverAnswer, toast: 'Kuba odpisał: connect, Wytrych z Darknetu, crack' } } });
  const { store } = renderWithStore(<><ToastHost /><Probe /><Hidden /></>);
  act(() => store.apply(step(store.get(), [], [{ kind: 'mailArrives', thread: 'kuba', msg: { from: 'Kuba', when: '', html: 'odp' }, delayMs: 1200 }])));
  expect(screen.getByTestId('h')).toHaveTextContent('true');
  act(() => vi.advanceTimersByTime(1199)); expect(screen.queryByText(/Kuba odpisał/)).toBeNull();
  act(() => vi.advanceTimersByTime(1));
  expect(screen.getByTestId('h')).toHaveTextContent('false');
  expect(screen.getByText('Kuba odpisał: connect, Wytrych z Darknetu, crack')).toBeInTheDocument();
});
it('open otwiera okno', () => {
  const { store } = renderWithStore(<Probe />);
  act(() => store.apply(step(store.get(), [], [{ kind: 'open', app: 'mail' }])));
  expect(screen.getByTestId('order')).toHaveTextContent('mail');
});
