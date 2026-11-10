import { createStore, type Store } from './engine/store';
import { SAVE_KEY, deserialize, interruptOnLoad, newGame } from './engine/state';

export function safeStorage(): Storage | null {
  try {
    const st = window.localStorage;
    st.getItem(SAVE_KEY);
    return st;
  } catch {
    return null;
  }
}

export function bootGame(storage: Storage | null): { store: Store; fresh: boolean } {
  let saved = null;
  try {
    saved = deserialize(storage?.getItem(SAVE_KEY) ?? null);
  } catch {
    saved = null;
  }
  if (saved) return { store: createStore(interruptOnLoad(saved), { persist: storage }), fresh: false };
  return { store: createStore(newGame(), { persist: storage }), fresh: true };
}
