import type { GameState, MissionId, StepResult } from './types';
import { step } from './types';
import { missionDef } from './missions';

/** Pole oddania w Poczcie (dane do <DeliveryBox>). */
export type ReplyBox = {
  title: string;          // nagłówek, celownik: 'Odpowiedz Kubie'
  text: string;           // tekst startowy textarea
  button: string;         // 'Wyślij'
  cost: number;           // minuty gry za wysłanie
  attach: boolean;        // true: trzeba wybrać plik z Pobranych; false: sam tekst (raport)
  emptyAttach?: string;   // podpowiedź, gdy attach i Pobrane tej misji są puste
};

export type DeliveryDef = {
  kind: 'file' | 'report';
  title?: string;
  box?: (s: GameState) => ReplyBox | null;
  send?: (s: GameState, text: string, fileId: string | null) => StepResult;
};

export function replyBox(s: GameState, id: MissionId): ReplyBox | null {
  return missionDef(id).delivery.box?.(s) ?? null;
}

export function canDeliver(s: GameState, id: MissionId): boolean {
  return s.active === id && !s.failed && typeof missionDef(id).delivery.send === 'function' && replyBox(s, id) !== null;
}

/** Oddanie zlecenia; poza swoją chwilą albo bez wymaganego pliku nic nie robi. Tekst escapuje `send`. */
export function deliver(s: GameState, id: MissionId, text: string, fileId: string | null = null): StepResult {
  if (!canDeliver(s, id)) return step(s);
  const box = replyBox(s, id)!;
  if (box.attach && !fileId) return step(s);
  return missionDef(id).delivery.send!(s, text, box.attach ? fileId : null);
}
