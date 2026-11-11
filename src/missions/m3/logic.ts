import type { AppId, GameState, Line, StepResult } from '../../engine/types';
import { step } from '../../engine/types';
import { fill } from '../../engine/text';
import { bug, bugAtS1, reusedBugSub } from '../../engine/devices';
import { isLinkedToS1 } from '../../engine/commands/basic';
import { TRIP_FAILED_SUB, tripFailed } from '../../engine/trip';
import { M3_ROUTE } from './cams';
import { M3_ACCEPTED_LINE, M3_DIRECT_LINE } from './texts';

/** Linie Terminala po przyjęciu (makieta 1803–1804) i okno „Plan piętra” od razu. */
export function m3OnAccept(s: GameState): StepResult {
  const lines: Line[] = [{ html: M3_ACCEPTED_LINE }];
  if (bugAtS1(s)) lines.push({ html: fill(M3_DIRECT_LINE, { zapas: String(bug(s)!.minutes) }) });
  return step(s, lines, [{ kind: 'open', app: 'plan' }]);
}

/** Etap zlecenia (makieta linia 726, z poprawką na stan trwały: po skanie etap nie cofa się). */
export function m3StageIndex(s: GameState): number {
  if (s.done.includes('m3')) return 7;
  if (M3_ROUTE.every((ip) => s.net.checked.includes(ip))) return 4;
  if (isLinkedToS1(s) || s.net.scanned) return 3;
  if (bugAtS1(s)) return 2;
  return s.active === 'm3' ? 1 : 0;
}

/** Podpis etapu wyjazdu: pominięty (podsłuch już wisiał) albo nieudany. */
export function m3StageSub(s: GameState, i: number): string | null {
  return i === 1 ? (reusedBugSub(s) ?? (tripFailed(s) ? TRIP_FAILED_SUB : null)) : null;
}

/** Pasek misji w Terminalu (makieta 1806, 916, 870, 1436, 1833). */
export function m3TermStep(s: GameState): string {
  switch (m3StageIndex(s)) {
    case 0: return 'przeczytaj mail od L.';
    case 1: return 'otwórz Mapę i znajdź wieżowiec';
    case 2: return 'połącz się z PODSŁUCH-1 (use S1)';
    case 3: return s.net.scanned ? 'znajdź cel: scan, NetMap, probe' : 'następny krok: znajdź cel w sieci za S1';
    case 4: return 'zaplanuj kamery na 21:14 (at), potem disconnect i wait';
    default: return 'zlecenie zakończone';
  }
}

/** „!” na Mapie przed wyjazdem (makieta 1802). */
export function m3AppBadges(s: GameState): (AppId | 'map')[] {
  return m3StageIndex(s) === 1 ? ['map'] : [];
}
