import type { MissionDef } from '../../engine/missions';
import { m3OnAccept } from './logic';
import {
  M3_ACCEPT_REPLY, M3_ANSWER, M3_ANSWER_TOAST, M3_NOTES, M3_NOTES_FOOTER, M3_NOTES_INTRO, M3_NOTES_TITLE, M3_OFFER_BODY, M3_STAGES,
} from './texts';

export const m3: MissionDef = {
  id: "m3",
  title: "Spacer o 21:14",
  giver: { id: "l", name: "L." },
  barName: "Kamery w Hotelu Luksus",
  availability: { afterMissions: ['kuba'], offerGroup: 'po-kubie' },
  offer: {
    subject: "Spacer o 21:14",
    when: "{dzień} 13:52",
    reward: 2000,
    levelLabel: "Poziom 2",
    body: M3_OFFER_BODY,
    acceptReply: M3_ACCEPT_REPLY,
    acceptCost: 1,
    giverAnswer: { delayMs: 900, cost: 2, text: M3_ANSWER, toast: M3_ANSWER_TOAST },
  },
  introLine: "w Poczcie czeka wiadomość od L.",
  notes: M3_NOTES,
  notesTitle: M3_NOTES_TITLE,
  notesIntro: M3_NOTES_INTRO,
  notesFooter: M3_NOTES_FOOTER,
  stages: M3_STAGES,
  stageIndex: () => 0,
  network: {},
  apps: ['plan'],
  termLabel: 'kamery w Hotelu Luksus',
  onAccept: m3OnAccept,
  help: [],
  delivery: { kind: "report" },
  rewards: { money: 2000, xp: 80 },
  bonuses: [],
  summary: () => [],
  doneLog: ["> Raport wysłany: wszedł i wyszedł.", "> L. potwierdził.", "> Zlecenie zakończone."],
  failLog: ["> L. odwołał zlecenie.", "> Zlecenie nieudane."],
};
