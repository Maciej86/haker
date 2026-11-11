import type { GameState, Line, StepResult } from '../../engine/types';
import { step } from '../../engine/types';
import { fill } from '../../engine/text';
import { bug } from '../../engine/devices';
import { W_ACCEPTED_LINE, W_DIRECT_LINE } from './texts';

/** Linie Terminala po przyjęciu zlecenia (makieta 1867–1868). */
export function wOnAccept(s: GameState): StepResult {
  const lines: Line[] = [{ html: W_ACCEPTED_LINE }];
  if (s.net.reusedBug) lines.push({ html: fill(W_DIRECT_LINE, { zapas: String(bug(s)!.minutes) }) });
  return step(s, lines);
}
