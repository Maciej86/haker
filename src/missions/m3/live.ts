// Czas rzeczywisty zlecenia L.: minuty na żywo przed oknem i straż oceny okna.
import type { GameState, StepResult } from '../../engine/types';
import { andThen, step } from '../../engine/types';
import type { RealtimeSource } from '../../engine/realtime';
import { advance } from '../../engine/clock';
import { spend } from '../../engine/devices';
import { isLinkedToS1 } from '../../engine/commands/basic';
import { m3StageIndex } from './logic';
import { m3Check } from './window';

/** Minuty na żywo (makieta linia 1808): od 4 min przed oknem do jego startu; w powrocie od wiadomości L. (plan 32). */
export function m3Live(s: GameState): boolean {
  const m = s.mission.m3;
  return s.active === 'm3' && !s.failed && !m.fail && !m.ok && m3StageIndex(s) >= 2
    && (m.leg === 2 ? m.noticed : s.t >= m.win.start - 4) && s.t <= m.win.start;
}

/** 1 min gry = 30 s (2 s gry na 1 s); przy połączeniu z S1 także 1 min urządzenia (linia 1412). `net.s1Ms` stoi. */
function liveTick(s: GameState, ms: number): StepResult {
  let acc = s.sec + Math.round(ms / 500);
  let r: StepResult = step(s);
  while (acc >= 60) {
    acc -= 60;
    r = andThen(r, (x) => (isLinkedToS1(x) ? spend(x, 1, 1) : step(advance(x, 1))));
  }
  r = { ...r, state: { ...r.state, sec: acc } };
  return andThen(r, m3Check);
}

export const M3_LIVE_SOURCE: RealtimeSource = {
  id: 'm3-live',
  pausesS1: true,
  holdOnLoad: true,
  active: (s) => s.screen === 'desktop' && s.overlay === null && m3Live(s),
  tick: liveTick,
};

/** Ocena okna także po poleceniach z innych tabel (scan, probe) i po tiku 's1'. */
export const M3_WATCH_SOURCE: RealtimeSource = {
  id: 'm3-watch',
  active: (s) => s.screen === 'desktop' && s.overlay === null && s.active === 'm3',
  tick: (s) => m3Check(s),
};
