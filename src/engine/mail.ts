import type { GameState, MissionId, StepResult } from './types';
import { step } from './types';
import { acceptOffer, isBlocked, missionDef, visibleOffers } from './missions';

export type ThreadStatus = 'open' | 'blocked' | 'accepted' | 'done';

export function mailThreads(s: GameState): { id: MissionId; from: string; subject: string; unread: boolean }[] {
  return visibleOffers(s).map((id) => {
    const d = missionDef(id);
    return { id, from: d.giver.name, subject: d.offer.subject, unread: !s.mail.read.includes(id) };
  });
}

export function unreadCount(s: GameState): number {
  return mailThreads(s).filter((t) => t.unread).length;
}

export function defaultThread(s: GameState): MissionId | null {
  const all = mailThreads(s);
  return (all.find((t) => t.unread) ?? all[0])?.id ?? null;
}

export function markRead(s: GameState, id: MissionId): GameState {
  if (s.mail.read.includes(id)) return s;
  return { ...s, mail: { ...s.mail, read: [...s.mail.read, id] } };
}

export function setDraft(s: GameState, id: MissionId, text: string): GameState {
  return { ...s, mail: { ...s.mail, draft: { ...s.mail.draft, [id]: text } } };
}

export function threadStatus(s: GameState, id: MissionId): ThreadStatus {
  if (s.done.includes(id)) return 'done';
  if (s.active === id) return 'accepted';
  if (isBlocked(s, id)) return 'blocked';
  return 'open';
}

export function sendAccept(s: GameState, id: MissionId, text: string): StepResult {
  if (threadStatus(s, id) !== 'open') return step(s);
  return acceptOffer(setDraft(s, id, text), id);
}
