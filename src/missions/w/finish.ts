// Zakończenie zlecenia W. (plan 22): premie za styl, kara za zostawione S1, podsumowanie.
// Fikcyjna gra: „serwer banku” i „logi” to dane łamigłówki w pamięci.
import type { GameState, StepResult, SummaryRow } from '../../engine/types';
import { andThen, step } from '../../engine/types';
import { failMission } from '../../engine/missions';
import type { BonusDef } from '../../engine/missions';
import { gclk } from '../../engine/clock';
import { bug } from '../../engine/devices';
import { isLinkedToS1 } from '../../engine/commands/basic';
import { endSession, onServer } from '../../engine/server';
import { W_BONUS_LABELS, W_DEADLINE_MAIL, W_LATE_REPLY, W_LEFT_S1_ROW, W_LOG_BAD_ROW } from './texts';

const DEADLINE = 19 * 60;
/** Kara za połączenie z S1 zostawione po wysłaniu (linia 1326). */
const LEFT_S1_PENALTY = 10;

/** Premie, kolejność i kwoty z linii 1314–1315. */
export const W_BONUSES: BonusDef[] = [
  { label: W_BONUS_LABELS[0], money: 300, when: (s) => DEADLINE - s.t >= 30 },
  { label: W_BONUS_LABELS[1], money: 200, when: (s) => !s.srv.caught && !s.srv.alert },
  { label: W_BONUS_LABELS[2], money: 100, when: (s) => s.mission.w.disc && !s.mission.w.sentOnSrv },
  // tylko własne wiersze z 10.42.0.250; cudzy wiersz albo rm auth.log ustawia logBad, każda nowa akcja dopisuje wiersz
  { label: W_BONUS_LABELS[3], money: 300, when: (s) => s.srv.logClean && !s.srv.logBad && !s.srv.log.some((l) => l.me) },
];

/** Przed nagrodą: zapamiętuje, skąd gracz wysłał plik, kończy sesję, a za zostawione S1 zdejmuje 10 min urządzenia
 * (wprost, bez linii o wyczerpaniu). */
export function wOnFinish(s: GameState): StepResult {
  const leftS1 = isLinkedToS1(s);
  const marked: GameState = { ...s, mission: { ...s.mission, w: { ...s.mission.w, leftS1, sentOnSrv: onServer(s) } } };
  return andThen(endSession(marked), (n) => {
    if (!leftS1) return step(n);
    return step({
      ...n,
      devices: n.devices.map((d) => (d.id === 'bug1' && d.where === 'S1'
        ? { ...d, minutes: Math.max(0, d.minutes - LEFT_S1_PENALTY) }
        : d)),
    });
  });
}

/** Wiersze podsumowania po premiach i motywie (linie 1326–1328). */
export function wSummary(s: GameState): SummaryRow[] {
  const rows: SummaryRow[] = [];
  if (s.mission.w.leftS1) rows.push({ label: W_LEFT_S1_ROW, value: '', tone: 'bad' });
  if (s.srv.logBad) rows.push({ label: W_LOG_BAD_ROW, value: '', tone: 'bad' });
  rows.push({ label: `Czas: ${gclk(s)} · PODSŁUCH-1 zostało ${bug(s)?.minutes ?? 0} min (zostaje u Ciebie)`, value: '' });
  return rows;
}

/** Plik wysłany po 19:00 (po doliczeniu minuty za wysłanie): odpowiedź o terminie zamiast oceny pliku (linie 1303–1304). */
export function wLate(s: GameState): string | null {
  return s.t > DEADLINE ? W_LATE_REPLY : null;
}

/** 19:00 minęła bez pliku: koniec sesji (gracz wraca do domu, podsłuch przestaje się zużywać), list W., porażka (linie 1414–1415). */
export function wOnDeadline(s: GameState): StepResult {
  return andThen(endSession(s), (n) => failMission({
    ...n,
    mail: { ...n.mail, threads: { ...n.mail.threads, w: [...(n.mail.threads.w ?? []), { from: 'W.', when: gclk(n), html: W_DEADLINE_MAIL, bad: true }] } },
  }));
}
