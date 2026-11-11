import type { MissionDef } from '../../engine/missions';
import { M3_NETWORK, m3AppBadges, m3OnAccept, m3OnProbe, m3StageIndex, m3StageSub, m3TermStep } from './logic';
import {
  M3_ACCEPT_REPLY, M3_ANSWER, M3_HELP_CAMS, M3_ANSWER_TOAST, M3_NOTES, M3_NOTES_FOOTER, M3_NOTES_INTRO, M3_NOTES_TITLE, M3_OFFER_BODY, M3_STAGES, M3_TRIP,
} from './texts';
import { m3PlanView } from './plan';
import { M3_COMMANDS } from './window';
import { M3_LIVE_SOURCE, M3_WATCH_SOURCE } from './live';
import { m3ClockView, m3Jump } from './clock';
import { M3_BONUSES, M3_DELIVERY, m3AdjustReward, m3Summary } from './finish';

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
  stageIndex: m3StageIndex,
  stageSub: m3StageSub,
  termStep: m3TermStep,
  appBadges: m3AppBadges,
  trip: M3_TRIP,
  network: M3_NETWORK,
  onProbe: m3OnProbe,
  apps: ['plan', 'clock'],
  floorPlan: m3PlanView,
  termLabel: 'kamery w Hotelu Luksus',
  onAccept: m3OnAccept,
  help: [M3_HELP_CAMS],
  commands: M3_COMMANDS,
  realtime: [M3_LIVE_SOURCE, M3_WATCH_SOURCE],
  clock: m3ClockView,
  clockJump: m3Jump,
  delivery: M3_DELIVERY,
  rewards: { money: 2000, xp: 80 },
  bonuses: M3_BONUSES,
  summary: m3Summary,
  adjustReward: m3AdjustReward,
  doneLog: ["> Raport wysłany: wszedł i wyszedł.", "> L. potwierdził.", "> Zlecenie zakończone."],
  failLog: ["> L. odwołał zlecenie.", "> Zlecenie nieudane."],
};
