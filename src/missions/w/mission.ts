import type { MissionDef } from '../../engine/missions';
import type { TripDef } from '../../engine/trip';
import { wOnAccept } from './logic';
import {
  W_ACCEPT_REPLY, W_ANSWER, W_ANSWER_TOAST, W_HELP_CRACK, W_HINTS, W_NOTES, W_NOTES_FOOTER, W_NOTES_INTRO,
  W_OFFER_BODY, W_STAGES, W_TARGET_IP,
} from './texts';

/** Wyjazd do Poznania (wartości jak SAMPLE_TRIP planu 04; progress z wyjazd.tpl.html linia 411). */
const W_TRIP: TripDef = {
  city: 'Poznań',
  mapLabel: 'centrala Banku Wiślanego, centrum Poznania',
  mapText: 'Dane z centrali Banku Wiślanego w centrum Poznania. Budynek trzeba znaleźć samemu.',
  packageFrom: 'W.',
  deadline: 19 * 60,
  progressSub: 'dane z centrali Banku Wiślanego',
  progress: [
    { title: 'Rozpoznanie', sub: 'mapa, telefon do banku, konto klienta' },
    { title: 'Podłożenie podsłuchu przy skrzynce', sub: 'wyjazd do Poznania' },
    { title: 'Połączenie z podsłuchem', sub: 'komputer w domu, Terminal → use S1' },
    { title: 'Zadanie właściwe', sub: 'zależy od zlecenia; tu: wejście do sieci banku i zdobycie danych' },
    { title: 'Oddanie zlecenia', sub: 'dane mailem do zleceniodawcy przed {dzień} 19:00' },
  ],
  tripStage: 1,
};

export const w: MissionDef = {
  id: 'w',
  title: 'Zestawienie oddziałów',
  giver: { id: 'w', name: 'W.' },
  barName: 'Dane z centrali Banku Wiślanego',
  availability: { afterMissions: ['kuba'], offerGroup: 'po-kubie' },
  offer: {
    subject: 'Zestawienie oddziałów',
    when: '{dzień} 13:50',
    reward: 2500,
    levelLabel: 'Poziom 2',
    body: W_OFFER_BODY,
    acceptReply: W_ACCEPT_REPLY,
    acceptCost: 1,
    giverAnswer: { delayMs: 1200, cost: 2, text: W_ANSWER, toast: W_ANSWER_TOAST },
  },
  deadline: { time: 19 * 60 },
  introLine: 'w Poczcie czeka wiadomość od W.',
  notes: W_NOTES,
  notesTitle: 'Notatki · zlecenie Banku Wiślanego',
  notesIntro: W_NOTES_INTRO,
  notesFooter: W_NOTES_FOOTER,
  stages: W_STAGES,
  stageIndex: () => 0,
  network: { isTarget: (_s, n) => n.ip === W_TARGET_IP },
  help: [W_HELP_CRACK],
  hints: W_HINTS,
  hintsOpen: (s) => !s.mission.w.found,
  trip: W_TRIP,
  appBadges: (s) => (s.active === 'w' ? ['map'] : []),
  termLabel: 'dane z centrali Banku Wiślanego',
  onAccept: wOnAccept,
  delivery: { kind: 'file' },
  rewards: { money: 2500, xp: 80 },
  bonuses: [],
  summary: () => [],
  doneLog: ['> Plik dostarczony: zestawienie oddziałów.', '> W. potwierdził odbiór.', '> Zlecenie zakończone.'],
  failLog: ['> Plik dotarł po terminie.', '> Zlecenie nieudane.'],
};
