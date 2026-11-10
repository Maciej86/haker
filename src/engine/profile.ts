import type { GameState } from './types';
import type { ThemeId } from '../theme/themes';

export const PROFILE_KEY = 'neonos-profile';
export type Profile = { themes: string[]; achievements: string[] };

export const THEME_UNLOCKS: { id: ThemeId; name: string; req: number }[] = [
  { id: 'fosfor', name: 'Fosfor', req: 0 },
  { id: 'neon', name: 'Neon', req: 1 },
  { id: 'bursztyn', name: 'Bursztyn', req: 2 },
  { id: 'halo', name: 'Halo Systems', req: 3 },
];

const defaults = (): Profile => ({ themes: ['fosfor'], achievements: [] });
const strs = (v: unknown): string[] | null =>
  Array.isArray(v) && v.every((x) => typeof x === 'string') ? (v as string[]) : null;

export function loadProfile(st: Storage | null): Profile {
  try {
    const raw = st?.getItem(PROFILE_KEY);
    if (!raw) return defaults();
    const o = JSON.parse(raw) as unknown;
    if (typeof o !== 'object' || o === null) return defaults();
    const themes = strs((o as Record<string, unknown>).themes);
    const achievements = strs((o as Record<string, unknown>).achievements);
    if (!themes || !achievements) return defaults();
    return { themes, achievements };
  } catch {
    return defaults();
  }
}

export function saveProfile(st: Storage | null, p: Profile): void {
  try {
    st?.setItem(PROFILE_KEY, JSON.stringify(p));
  } catch {
    /* brak miejsca lub zablokowany dostęp: profil po prostu się nie zapisze */
  }
}

export function unlockedThemes(doneCount: number): ThemeId[] {
  return THEME_UNLOCKS.filter((t) => t.req <= doneCount).map((t) => t.id);
}

export function mergeProfile(p: Profile, s: GameState): Profile {
  const themes = [...p.themes];
  for (const id of unlockedThemes(s.done.length)) if (!themes.includes(id)) themes.push(id);
  return { ...p, themes };
}
