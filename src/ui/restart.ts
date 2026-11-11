import { newGame } from '../engine/state';
import { useStore } from './useGame';
import { useWindows } from './windows';
import { clearHiddenMail } from '../apps/mail/delayed';
import { setTerminalInput } from '../apps/terminal/input';
import { clearTermHold } from '../apps/terminal/hold';
import { walk } from '../apps/plan/walk';

/** Zegary UI poza stanem gry (odpowiedzi „po chwili”, wstrzymanie Terminala, pokaz na planie): przy nowej grze,
 * powtórce dnia i skokach dev, żeby nic ze starego przebiegu nie odpaliło w nowym. */
export function clearUiTimers(): void {
  clearHiddenMail();
  clearTermHold();
  walk.clear();
}

/** Nowa gra: świeży stan i okna jak na starcie (Terminal i Poczta). Profil (motywy, osiągnięcia) zostaje;
 * zaległe odpowiedzi „po chwili”, pokaz na planie piętra i wpisane polecenie znikają. */
export function useRestart(): () => void {
  const store = useStore();
  const windows = useWindows();
  return () => {
    clearUiTimers();
    setTerminalInput('');
    store.apply(newGame());
    windows.reset(['terminal', 'mail']);
  };
}
