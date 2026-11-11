// Raport dla L., premie i podsumowanie zlecenia (makieta linie 1827–1840, 1854–1856).
import type { GameState, MailMsg, SummaryRow } from '../../engine/types';
import type { BonusDef } from '../../engine/missions';
import { finishMission } from '../../engine/missions';
import type { DeliveryDef, ReplyBox } from '../../engine/delivery';
import { advance, gclk } from '../../engine/clock';
import { esc, fill } from '../../engine/text';
import { bug } from '../../engine/devices';
import { isLinkedToS1 } from '../../engine/commands/basic';
import { M3_BONUS_LABELS, M3_LATE_LABEL, M3_TIME_ROW, m3OpenCamsRow } from './texts';

/** Linie 1854–1855. */
export const M3_REPORT_BOX: ReplyBox = {
  title: 'Odpowiedz L.', text: 'Zrobione. Kamery posprzątane.', button: 'Wyślij raport', cost: 1, attach: false,
};

/** Raport: pole po ocenie drogi powrotnej; wysłanie (linia 1856) kosztuje 1 min i kończy zlecenie. Bez odpowiedzi L. */
export const M3_DELIVERY: DeliveryDef = {
  kind: 'report',
  title: 'Odpowiedz L.',
  box: (s) => (s.active === 'm3' && s.mission.m3.ok && !s.mission.m3.fail ? M3_REPORT_BOX : null),
  send: (s, text) => {
    const s1 = advance(s, M3_REPORT_BOX.cost);
    const mine: MailMsg = { from: 'Ty', when: gclk(s1), html: esc(text) };
    const sent: GameState = {
      ...s1,
      mail: { ...s1.mail, threads: { ...s1.mail.threads, m3: [...(s1.mail.threads.m3 ?? []), mine] } },
    };
    return finishMission(sent, 'm3');
  },
};

/** m3Bonus, linie 1828–1829. */
export const M3_BONUSES: BonusDef[] = [
  { label: M3_BONUS_LABELS[0], money: 300, when: (s) => !s.mission.m3.err && s.mission.m3.wins.length === 2 },
  { label: M3_BONUS_LABELS[1], money: 200, when: (s) => !s.mission.m3.extra },
  { label: M3_BONUS_LABELS[2], money: 100, when: (s) => !isLinkedToS1(s) },
];

/** 1500 ¤ zamiast 2000 ¤ po błędzie (linia 1830). */
export function m3AdjustReward(s: GameState): { money: number; label: string } | null {
  return s.mission.m3.late ? { money: 1500, label: M3_LATE_LABEL } : null;
}

/** Wiersze po premiach (linie 1839–1840): kamery zostawione wyłączone (z adresami) i czas z zapasem podsłuchu. */
export function m3Summary(s: GameState): SummaryRow[] {
  const open = s.mission.m3.log.filter((c) => c.on === null);
  const rows: SummaryRow[] = [];
  if (open.length) {
    const ips = [...new Set(open.map((c) => c.ip))];
    rows.push({ label: m3OpenCamsRow(ips.length), value: ips.map((ip) => '.' + ip.split('.').pop()).join(', '), tone: 'bad' });
  }
  rows.push({ label: fill(M3_TIME_ROW, { czas: gclk(s), min: String(bug(s)?.minutes ?? 0) }), value: '' });
  return rows;
}
