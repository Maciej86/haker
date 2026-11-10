// @vitest-environment jsdom
import { act, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { step } from '../../src/engine/types';
import { GainBubble, useSkillFlash } from '../../src/ui/GainBubble';
import { ToastHost, pushToast } from '../../src/ui/Toast';
import { renderWithStore } from './helpers';

beforeEach(() => { vi.useFakeTimers(); });

it('toast z gry znika po 3,5 s', () => {
  const { store } = renderWithStore(<ToastHost />);
  act(() => store.apply(step(store.get(), [], [{ kind: 'toast', text: 'Kupiono: Wytrych 1.0' }])));
  expect(screen.getByText('Kupiono: Wytrych 1.0')).toHaveClass('toast');
  act(() => vi.advanceTimersByTime(3500)); expect(screen.queryByText('Kupiono: Wytrych 1.0')).toBeNull();
});
it('toast błędu ma klasę err', () => { renderWithStore(<ToastHost />); act(() => pushToast('Brakuje', true)); expect(screen.getByText('Brakuje')).toHaveClass('err'); });
it('przyrost: dymek i błysk paska przez 1,6 s', () => {
  const Flash = () => <b data-testid="f">{useSkillFlash() ?? '-'}</b>;
  const { store } = renderWithStore(<><ToastHost /><GainBubble /><Flash /></>);
  act(() => store.apply(step(store.get(), [], [{ kind: 'gain', sk: 'Linux', v: 0.3, why: 'pierwsze ls na cudzym serwerze' }])));
  expect(screen.getByText('+0,3 Linux · pierwsze ls na cudzym serwerze')).toBeInTheDocument();
  expect(screen.getByTestId('f')).toHaveTextContent('Linux');
  act(() => vi.advanceTimersByTime(1600)); expect(screen.getByTestId('f')).toHaveTextContent('-');
});
