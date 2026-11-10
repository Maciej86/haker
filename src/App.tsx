import { useMemo } from 'react';
import { Mobile } from './screens/mobile/Mobile';
import type { Store } from './engine/store';
import { safeStorage } from './boot';
import { useIsNarrow } from './ui/useIsNarrow';
import { StoreContext } from './ui/useGame';
import { ProfileProvider } from './ui/useProfile';

export default function App({ store, fresh }: { store: Store; fresh: boolean }) {
  const narrow = useIsNarrow();
  const storage = useMemo(safeStorage, []);
  void fresh; // pełne złożenie ekranów w Zadaniu 18
  // Stan gry żyje poza Reactem, więc przełączenie ekranu go nie gubi.
  return (
    <StoreContext.Provider value={store}>
      <ProfileProvider storage={storage}>
        {narrow ? <Mobile /> : <div data-testid="game" />}
      </ProfileProvider>
    </StoreContext.Provider>
  );
}
