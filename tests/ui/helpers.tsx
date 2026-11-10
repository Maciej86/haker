import type { ReactElement } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { createStore, type Store } from '../../src/engine/store';
import type { GameState } from '../../src/engine/types';
import { StoreContext } from '../../src/ui/useGame';
import { useUiEvents } from '../../src/ui/useUiEvents';
import { useTerminalInput } from '../../src/apps/terminal/input';
import { rectFor } from '../../src/apps/registry';
import { WindowsProvider, useWindows } from '../../src/ui/windows';
import { ProfileProvider } from '../../src/ui/useProfile';
import { game } from '../engine/fixtures';

export function renderWithStore(ui: ReactElement, state: GameState = game()): RenderResult & { store: Store } {
  const store = createStore(state, { persist: null });
  const r = render(
    <StoreContext.Provider value={store}>
      <ProfileProvider storage={null}><WindowsProvider rectFor={rectFor}>{ui}</WindowsProvider></ProfileProvider>
    </StoreContext.Provider>,
  );
  return { ...r, store };
}

export function Probe() {
  useUiEvents();
  const w = useWindows();
  return <><b data-testid="order">{w.order.join(',')}</b><TermInputProbe /></>;
}
export function TermInputProbe() {
  return <i data-testid="input">{useTerminalInput()[0]}</i>;
}
