import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loadProfile, mergeProfile, saveProfile, unlockedThemes, type Profile } from '../engine/profile';
import { checkAchievements } from '../engine/achievements';
import { THEMES, applyTheme, pickTheme, type ThemeId } from '../theme/themes';
import { getPref } from './prefs';
import { useStore } from './useGame';

type ProfileCtx = { profile: Profile; unlocked: ThemeId[]; previewAll: boolean; setPreviewAll(v: boolean): void };
const Ctx = createContext<ProfileCtx | null>(null);

const ALL: ThemeId[] = THEMES.map((t) => t.id);

export function ProfileProvider({ storage, children }: { storage: Storage | null; children: ReactNode }) {
  const store = useStore();
  const [profile, setProfile] = useState<Profile>(() => mergeProfile(loadProfile(storage), store.get()));
  const [previewAll, setPreviewAll] = useState(false);
  const [done, setDone] = useState(() => store.get().done.length);

  useEffect(() => {
    const update = () => {
      const s = store.get();
      const base = loadProfile(storage);
      let p = mergeProfile(base, s);
      const fresh = checkAchievements(s, p).filter((id) => !p.achievements.includes(id));
      if (fresh.length) p = { ...p, achievements: [...p.achievements, ...fresh] };
      if (p.themes.length !== base.themes.length || fresh.length) saveProfile(storage, p);
      setProfile((old) =>
        old.themes.join() === p.themes.join() && old.achievements.join() === p.achievements.join() ? old : p);
      setDone(s.done.length);
    };
    update();
    return store.subscribe(update);
  }, [store, storage]);

  const unlocked = useMemo<ThemeId[]>(
    () => ALL.filter((id) => previewAll || profile.themes.includes(id) || unlockedThemes(done).includes(id)),
    [profile, done, previewAll],
  );

  useEffect(() => {
    applyTheme(pickTheme(getPref('neonos-theme', 'fosfor'), unlocked));
    // tylko przy montażu: późniejsze zmiany motywu robi panel ustawień
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(() => ({ profile, unlocked, previewAll, setPreviewAll }), [profile, unlocked, previewAll]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProfile(): ProfileCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('ProfileProvider: brak dostawcy');
  return c;
}
