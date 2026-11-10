import { createContext, useContext, useSyncExternalStore } from 'react';
import type { Store } from '../engine/store';
import type { GameState } from '../engine/types';

export const StoreContext = createContext<Store | null>(null);

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('StoreContext: brak magazynu');
  return s;
}

// Selektor zwraca wartość prostą albo istniejący fragment stanu, nigdy nowy obiekt czy tablicę.
export function useGame<T>(sel: (s: GameState) => T): T {
  const store = useStore();
  return useSyncExternalStore(store.subscribe, () => sel(store.get()));
}
