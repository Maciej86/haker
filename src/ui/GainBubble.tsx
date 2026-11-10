import { useEffect, useSyncExternalStore } from 'react';
import type { Skill } from '../engine/types';
import { fmtSkill } from '../engine/text';
import { pushToast } from './Toast';
import { useStore } from './useGame';

let flash: Skill | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };

function flashSkill(sk: Skill): void {
  flash = sk;
  emit();
  clearTimeout(timer);
  timer = setTimeout(() => { flash = null; emit(); }, 1600);
}

export function useSkillFlash(): Skill | null {
  return useSyncExternalStore(subscribe, () => flash);
}

export function GainBubble() {
  const store = useStore();
  useEffect(() => store.onUi((e) => {
    if (e.kind !== 'gain') return;
    pushToast(`+${fmtSkill(e.v)} ${e.sk} · ${e.why}`);
    flashSkill(e.sk);
  }), [store]);
  useEffect(() => () => { clearTimeout(timer); flash = null; }, []);
  return null;
}
