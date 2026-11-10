import { newGame } from '../engine/state';
import { useStore } from './useGame';
import { useWindows } from './windows';

/** Nowa gra: świeży stan i okna jak na starcie (Terminal i Poczta). Profil (motywy, osiągnięcia) zostaje. */
export function useRestart(): () => void {
  const store = useStore();
  const windows = useWindows();
  return () => {
    store.apply(newGame());
    windows.reset(['terminal', 'mail']);
  };
}
