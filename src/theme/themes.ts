import { THEME_UNLOCKS } from '../engine/profile';
import { setPref } from '../ui/prefs';

export type ThemeId = 'fosfor' | 'neon' | 'bursztyn' | 'halo';

const SW: Record<ThemeId, [string, string, string, string]> = {
  fosfor: ['#0a1116', '#1d4446', '#34f0b0', '#f4b942'],
  neon: ['#120c26', '#3a2a6e', '#3ee8ff', '#ff3d8b'],
  bursztyn: ['#0f0b05', '#4a3512', '#ffb000', '#ff5a36'],
  halo: ['#0b0f17', '#2b3a52', '#9cc8ff', '#f4d27a'],
};

export const THEMES: { id: ThemeId; name: string; req: number; sw: [string, string, string, string] }[] =
  THEME_UNLOCKS.map((t) => ({ ...t, sw: SW[t.id] }));

export function pickTheme(saved: string | null, unlocked: ThemeId[]): ThemeId {
  return unlocked.find((id) => id === saved) ?? 'fosfor';
}

export function applyTheme(id: ThemeId): void {
  document.documentElement.dataset.theme = id;
  setPref('neonos-theme', id);
}
