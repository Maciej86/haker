import type { AppId, GameState, Line, StepResult } from '../../engine/types';
import { step } from '../../engine/types';
import { fill } from '../../engine/text';
import { bug, bugAtS1, reusedBugSub } from '../../engine/devices';
import { isLinkedToS1 } from '../../engine/commands/basic';
import { TRIP_FAILED_SUB, tripFailed } from '../../engine/trip';
import { gain } from '../../engine/skills';
import type { NetworkOverlay } from '../../engine/missions';
import type { TowerNode } from '../../world/tower';
import { M3_CAMS, M3_ROUTE, isFloorCam } from './cams';
import { M3_ACCEPTED_LINE, M3_DIRECT_LINE, M3_NET_HINT, M3_PROBE_CAM, M3_PROBE_OTHER } from './texts';

/** Linie Terminala po przyjęciu (makieta 1803–1804) i okno „Plan piętra” od razu. */
export function m3OnAccept(s: GameState): StepResult {
  const lines: Line[] = [{ html: M3_ACCEPTED_LINE }];
  if (bugAtS1(s)) lines.push({ html: fill(M3_DIRECT_LINE, { zapas: String(bug(s)!.minutes) }) });
  return step(s, lines, [{ kind: 'open', app: 'plan' }]);
}

/** Etap zlecenia (makieta linia 726, z poprawką na stan trwały: po skanie etap nie cofa się). */
export function m3StageIndex(s: GameState): number {
  if (s.done.includes('m3')) return 7;
  if (s.active !== 'm3') return 0; // przed przyjęciem: podsłuch po W. przy S1 nie przesuwa etapu
  if (M3_ROUTE.every((ip) => s.net.checked.includes(ip))) return 4;
  if (isLinkedToS1(s) || s.net.scanned) return 3;
  return bugAtS1(s) ? 2 : 1;
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

/** Reakcja na probe (koszt i net.checked nalicza wspólne probe; makieta linia 1435). Bez „pudła”. */
export function m3OnProbe(s: GameState, node: TowerNode): StepResult {
  const vars = { ip: node.ip, kto: node.kto };
  if (!isFloorCam(node.kto)) return step(s, [{ html: fill(M3_PROBE_OTHER, vars) }]);
  const g = gain(s, 'Sieć', 0.3, 'kamera z 7. piętra znaleziona');
  return step(g.state, [{ html: fill(M3_PROBE_CAM, vars) }], g.ui);
}

/** Sieć wieżowca u L.: kamery p. 7 dochodzą do skanu; trafienie = kamera z p. 7 (makieta 1013, 1038). */
export const M3_NETWORK: NetworkOverlay = {
  addNodes: M3_CAMS,
  isTarget: (_s, n) => isFloorCam(n.kto),
  side: () => ({ hints: { html: M3_NET_HINT } }),
};
