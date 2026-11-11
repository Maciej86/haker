import { newGame } from '../engine/state';
import { useStore } from './useGame';
import { useWindows } from './windows';
import { clearHiddenMail } from '../apps/mail/delayed';
import { setTerminalInput } from '../apps/terminal/input';
import { clearTermHold } from '../apps/terminal/hold';
import { walk } from '../apps/plan/walk';

/** Nowa gra: świeży stan i okna jak na starcie (Terminal i Poczta). Profil (motywy, osiągnięcia) zostaje;
 * zaległe odpowiedzi „po chwili”, pokaz na planie piętra i wpisane polecenie znikają. */
export function useRestart(): () => void {
  const store = useStore();
  const windows = useWindows();
  return () => {
    clearHiddenMail();
    clearTermHold();
    walk.clear();
    setTerminalInput('');
    store.apply(newGame());
    windows.reset(['terminal', 'mail']);
  };
}
