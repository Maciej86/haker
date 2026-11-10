import type { GameState, StepResult } from '../../../src/engine/types';
import { newGame } from '../../../src/engine/state';
import { acceptOffer } from '../../../src/engine/missions';
import { runLine } from '../../../src/engine/terminal';
import type { KubaState } from '../../../src/missions/kuba/state';
import '../../../src/missions';

export const txt = (r: StepResult): string => r.lines.map((l) => l.html).join('\n');

export function run(s: GameState, ...cmds: string[]): StepResult {
  let cur = s;
  const lines: StepResult['lines'] = [];
  const ui: StepResult['ui'] = [];
  for (const c of cmds) {
    const r = runLine(cur, c);
    cur = r.state;
    lines.push(...r.lines);
    ui.push(...r.ui);
  }
  return { state: cur, lines, ui };
}

export const kubaAccepted = (seed = 1): GameState => acceptOffer(newGame(seed), 'kuba').state;

export const withKuba = (s: GameState, patch: Partial<KubaState>): GameState => ({
  ...s,
  mission: { ...s.mission, kuba: { ...s.mission.kuba, ...patch } },
});
