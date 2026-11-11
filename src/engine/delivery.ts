import type { FileRef, GameState, MailMsg, MissionId, StepResult } from './types';
import { step } from './types';
import { advance, gclk } from './clock';
import { esc } from './text';
import { finishMission, missionDef } from './missions';

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

/** Pobrane pliki tej misji, w kolejności pobrania. */
export function deliveryFiles(s: GameState, id: MissionId): FileRef[] {
  return s.downloads.filter((f) => f.mission === id);
}

export type FileDeliveryCfg = {
  title: string; text: string; emptyAttach: string; cost: number;
  judge: (s: GameState, file: FileRef) => { ok: boolean; reply: string };
  /** Po ilu minutach gry przychodzi odpowiedź na zły plik (domyślnie 1, jak u Kuby; W. 2). */
  badReplyAfter?: number;
};

/** Oddanie zlecenia plikiem z Pobranych: zły plik dostaje odpowiedź zleceniodawcy, dobry kończy misję. */
export function fileDelivery(id: MissionId, cfg: FileDeliveryCfg): DeliveryDef {
  return {
    kind: 'file',
    title: cfg.title,
    box: (s) => (s.active === id
      ? { title: cfg.title, text: cfg.text, button: 'Wyślij', cost: cfg.cost, attach: true, emptyAttach: cfg.emptyAttach }
      : null),
    send: (s, text, fileId) => {
      const file = deliveryFiles(s, id).find((f) => f.fileId === fileId);
      if (!file) return step(s);
      const giver = missionDef(id).giver;
      const s1 = advance(s, cfg.cost);
      const mine: MailMsg = { from: 'Ty', when: gclk(s1), html: esc(text), attachment: file.name };
      const { ok, reply } = cfg.judge(s1, file);
      const answer: MailMsg = ok
        ? { from: giver.name, when: gclk(s1, s1.t + 2), html: reply }
        : { from: giver.name, when: gclk(s1, s1.t + (cfg.badReplyAfter ?? 1)), html: reply, bad: true };
      const st: GameState = {
        ...s1,
        mail: { ...s1.mail, threads: { ...s1.mail.threads, [id]: [...(s1.mail.threads[id] ?? []), mine, answer] } },
      };
      if (!ok) return step(st, [], [{ kind: 'toast', text: `${giver.name}: ${reply}`, bad: true }]);
      return finishMission(st, id);
    },
  };
}
