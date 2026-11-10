import type { GameState, Skill } from '../../engine/types';
import { hhmm } from '../../engine/clock';
import { missionDef } from '../../engine/missions';
import { fmt, fmtSkill } from '../../engine/text';

export type EndView = {
  log: string[]; head: string; money: string; header: string; done: string[];
  xp: string; skills: [Skill, string][]; bug: string | null;
};

// misja.html linie 1630–1640
export function endView(s: GameState): EndView {
  const bug = s.devices.find((d) => d.where === 'S1' && d.minutes > 0);
  return {
    log: ['> Koniec demo.', '> Dziękujemy za grę.'],
    head: `Poziom ${s.lvl}`,
    money: fmt(s.money),
    header: `Ukończone zlecenia · ${s.day} ${hhmm(s.t)}`,
    done: s.done.map((id) => { const d = missionDef(id); return `✓ ${d.title} (${d.giver.name})`; }),
    xp: `${s.xp} XP`,
    skills: (Object.entries(s.skills) as [Skill, number][]).map(([sk, v]) => [sk, fmtSkill(v)]),
    bug: bug ? `PODSŁUCH-1 przy S1: zostało ${bug.minutes} min` : null,
  };
}
