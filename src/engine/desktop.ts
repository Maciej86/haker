import type { AppId, GameState, StepResult } from './types';
import { step } from './types';
import type { NoteCard } from './missions';
import { appBadges, focusMission, missionDef, stageView, termStep } from './missions';
import { unreadCount } from './mail';
import { helpBadge } from './help';

export function barLabel(s: GameState): string {
  return missionDef(focusMission(s))?.barName ?? 'Oferta w Poczcie';
}

export function termMissionLabel(s: GameState): string {
  const def = missionDef(focusMission(s));
  if (!def) return 'nowe zlecenie w Poczcie';
  return def.termLabel ?? `${def.title.charAt(0).toLowerCase()}${def.title.slice(1)} (${def.giver.name})`;
}

export function termStepLabel(s: GameState): string {
  if (s.summaryMeta?.next === 'retry') return 'zlecenie nieudane';
  if (s.summaryMeta) return 'zlecenie zakończone';
  return termStep(s) ?? stageView(s).find((x) => x.state === 'now')?.sub ?? 'przeczytaj ofertę w Poczcie';
}

export function notesView(s: GameState): { title: string; intro: string; cards: NoteCard[]; footer: string | null } {
  const def = missionDef(focusMission(s));
  if (!def) return { title: 'Notatki', intro: 'Brak notatek. Przyjmij zlecenie w Poczcie.', cards: [], footer: null };
  return {
    title: def.notesTitle ?? 'Notatki',
    intro: `${def.notesIntro ?? 'Twoje notatki.'} Czytanie nic nie kosztuje.`,
    cards: def.notes.filter((c) => !c.when || c.when(s)),
    footer: def.notesFooter ?? null,
  };
}

export function appBadge(s: GameState, id: AppId | 'map'): string | null {
  if (id === 'mail') { const n = unreadCount(s); return n > 0 ? String(n) : null; }
  if (id === 'help') return helpBadge(s) ? '!' : null;
  return appBadges(s).includes(id) ? '!' : null;
}

export function goMap(s: GameState): StepResult {
  return step({ ...s, screen: 'mapPoland' });
}

export function goDesktop(s: GameState): GameState {
  return { ...s, screen: 'desktop' };
}
