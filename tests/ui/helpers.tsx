import type { ReactElement } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { createStore, type Store } from '../../src/engine/store';
import type { GameState } from '../../src/engine/types';
import { StoreContext } from '../../src/ui/useGame';
import { ProfileProvider } from '../../src/ui/useProfile';
import { game } from '../engine/fixtures';

export function renderWithStore(ui: ReactElement, state: GameState = game()): RenderResult & { store: Store } {
  const store = createStore(state, { persist: null });
  const r = render(
    <StoreContext.Provider value={store}>
      <ProfileProvider storage={null}>{ui}</ProfileProvider>
    </StoreContext.Provider>,
  );
  return { ...r, store };
}
