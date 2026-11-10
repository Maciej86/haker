import type { GameState } from './types';
import type { Profile } from './profile';
import { MISSION_ORDER } from '../missions';

export type AchId = 'first' | 'scans' | 'buys' | 'kuba' | 'all';
export type Achievement = {
  id: AchId; title: string; desc: string; done: (s: GameState) => boolean;
  progress?: (s: GameState) => [number, number]; lockIcon?: boolean;
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first', title: 'Pierwszy dostęp', desc: 'Połącz się z pierwszym serwerem.', done: (s) => s.stats.first },
  {
    id: 'scans', title: 'Człowiek sieci', desc: 'Przeskanuj sieć 5 razy.',
    done: (s) => s.stats.scans >= 5, progress: (s) => [Math.min(s.stats.scans, 5), 5],
  },
  {
    id: 'buys', title: 'Zakupoholik', desc: 'Kup 3 rzeczy w sklepie lub na darknecie.',
    done: (s) => s.stats.buys >= 3, progress: (s) => [Math.min(s.stats.buys, 3), 3],
  },
  { id: 'kuba', title: 'Pierwsze zlecenie', desc: 'Ukończ misję od Kuby.', done: (s) => s.done.includes('kuba') },
  {
    id: 'all', title: 'Mistrz terminala', desc: 'Ukończ wszystkie misje.', lockIcon: true,
    done: (s) => MISSION_ORDER.every((id) => s.done.includes(id)),
  },
];

export function achievementView(s: GameState, p: Profile) {
  return ACHIEVEMENTS.map((a) => {
    const done = p.achievements.includes(a.id) || a.done(s);
    const progress = !done && a.progress ? a.progress(s) : null;
    return {
      id: a.id, title: a.title, desc: a.desc, done, progress,
      status: done ? '✓' : progress ? `${progress[0]}/${progress[1]}` : '',
      locked: !!a.lockIcon && !done,
    };
  });
}

export function checkAchievements(s: GameState, p: Profile): string[] {
  return ACHIEVEMENTS.filter((a) => a.done(s) && !p.achievements.includes(a.id)).map((a) => a.id);
}
