import type { GameState, Line, StepResult } from '../../engine/types';
import { step } from '../../engine/types';
import { fill } from '../../engine/text';
import { bug, bugAtS1 } from '../../engine/devices';
import { M3_ACCEPTED_LINE, M3_DIRECT_LINE } from './texts';

/** Linie Terminala po przyjęciu (makieta 1803–1804) i okno „Plan piętra” od razu. */
export function m3OnAccept(s: GameState): StepResult {
  const lines: Line[] = [{ html: M3_ACCEPTED_LINE }];
  if (bugAtS1(s)) lines.push({ html: fill(M3_DIRECT_LINE, { zapas: String(bug(s)!.minutes) }) });
  return step(s, lines, [{ kind: 'open', app: 'plan' }]);
}
