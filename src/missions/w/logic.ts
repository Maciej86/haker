import type { GameState, Line, StepResult } from '../../engine/types';
import { step } from '../../engine/types';
import { fill } from '../../engine/text';
import { bug, bugAtS1, reusedBugSub } from '../../engine/devices';
import { isLinkedToS1 } from '../../engine/commands/basic';
import { TRIP_FAILED_SUB, tripFailed } from '../../engine/trip';
import { W_ACCEPTED_LINE, W_DIRECT_LINE } from './texts';

/** Linie Terminala po przyjęciu zlecenia (makieta 1867–1868). */
export function wOnAccept(s: GameState): StepResult {
  const lines: Line[] = [{ html: W_ACCEPTED_LINE }];
  if (s.net.reusedBug) lines.push({ html: fill(W_DIRECT_LINE, { zapas: String(bug(s)!.minutes) }) });
  return step(s, lines);
}

/** Etap zlecenia (makieta linia 732, z poprawką na stan trwały: po skanie etap nie cofa się). */
export function wStageIndex(s: GameState): number {
  if (s.done.includes('w')) return 7;
  if (s.mission.w.found) return 5;
  if (isLinkedToS1(s) || s.net.scanned) return 4;
  if (bugAtS1(s)) return 3;
  if (s.screen === 'trip') return 2;
  return s.active === 'w' ? 1 : 0;
}

/** Podpis etapu wyjazdu: pominięty (podsłuch już wisiał) albo nieudany. */
export function wStageSub(s: GameState, i: number): string | null {
  return i === 2 ? (reusedBugSub(s) ?? (tripFailed(s) ? TRIP_FAILED_SUB : null)) : null;
}

/** Pasek misji w Terminalu (makieta 1866, 1806, 870, 916, 1438, 1874). */
export function wTermStep(s: GameState): string {
  switch (wStageIndex(s)) {
    case 0: return 'przeczytaj mail od W.';
    case 1:
    case 2: return 'otwórz Mapę i znajdź bank w Poznaniu';
    case 3: return 'połącz się z PODSŁUCH-1 (use S1)';
    case 4: return s.net.scanned ? 'znajdź cel: scan, NetMap, probe' : 'następny krok: znajdź cel w sieci za S1';
    case 5: return 'następny krok: włamanie do 10.42.7.12';
    default: return 'zlecenie zakończone';
  }
}
