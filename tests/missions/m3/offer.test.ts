import { expect, test } from 'vitest';
import type { GameState } from '../../../src/engine/types';
import { acceptOffer, isBlocked, missionDef, visibleOffers } from '../../../src/engine/missions';
import { deadlineLabel } from '../../../src/engine/clock';
import { notesView } from '../../../src/engine/desktop';
import { initM3State, M3_WINDOW } from '../../../src/missions/m3/state';
import { M3_ANSWER } from '../../../src/missions/m3/texts';
import { m3StartState } from '../../../src/missions/m3/dev';
import { txt } from '../kuba/helpers';
import '../../../src/missions';

const accepted = (p: Partial<GameState> = {}) => acceptOffer({ ...m3StartState(), ...p }, 'm3');

test('initM3State', () => {
  expect(initM3State()).toEqual({ win: { start: 1274, len: 3 }, log: [], err: 0, leg: 1, wins: [], late: false, ok: false,
    evalAt: null, extra: false, notice: null, noticed: false, fail: false });
  expect(initM3State().win).not.toBe(M3_WINDOW);
});
test('oferta L.: 2000 ¤, bez terminu, 5 minut i 7 minut w treści', () => {
  const d = missionDef('m3');
  expect(d.offer).toMatchObject({ subject: 'Spacer o 21:14', when: '{dzień} 13:52', reward: 2000, levelLabel: 'Poziom 2',
    acceptReply: 'Wchodzę w to. Twój człowiek przejdzie niezauważony.', acceptCost: 1 });
  expect(d.offer.body).toHaveLength(3);
  expect(d.offer.body[0]).toContain('O <b>21:14</b> wyjdzie z windy na <b>7. piętrze</b> i przejdzie do <b>pokoju 712</b>');
  expect(d.offer.body[0]).toContain('<b>5 minut przed tym, jak wyjdzie z pokoju</b>');
  expect(d.offer.body[1]).toContain('nie działa dłużej niż <b>7 minut</b>');
  expect(d.offer.body[2]).toBe('Płacę 2000 ¤. Wchodzisz w to?');
  expect(d.deadline).toBeUndefined();
  expect(d.apps).toEqual(['plan', 'clock']);
});
test('przyjęcie: 1 + 2 min, odpowiedź L., linia, okno planu', () => {
  const r = accepted();
  expect([r.state.t, r.state.active]).toEqual([833, 'm3']);
  expect(r.state.mail.threads.m3.map(m => [m.from, m.when])).toEqual([['Ty', 'czw 13:51'], ['L.', 'czw 13:53']]);
  expect(r.state.mail.threads.m3[1].html).toBe(M3_ANSWER);
  expect(M3_ANSWER).toContain('zostawię pod ławką na przystanku obok wieżowca');
  expect(M3_ANSWER).toContain('W załączniku <b>plan 7. piętra</b> z kamerami.');
  expect(r.ui).toContainEqual(expect.objectContaining({ kind: 'mailArrives', thread: 'm3', delayMs: 900 }));
  expect(r.ui).toContainEqual({ kind: 'open', app: 'plan' });
  expect(txt(r)).toContain('<span class="c">Zlecenie przyjęte.</span> Hotel Luksus, 7. piętro, okno 21:14. Dostęp: skrzynka S1 przy wieżowcu.');
  expect(txt(r)).not.toContain('Sprawdź: devices');
  expect(deadlineLabel(r.state)).toBeNull();
});
test('PODSŁUCH-1 przy S1: linia o zapasie (bez porady); wyczerpany: bez niej', () => {
  const live = txt(accepted({ devices: [{ id: 'bug1', where: 'S1', minutes: 41 }] }));
  expect(live).toContain('<span class="d">Przy S1 wisi już Twój PODSŁUCH-1 (zapas 41 min).</span>');
  expect(live).not.toContain('Sprawdź: devices');
  expect(txt(accepted({ devices: [{ id: 'bug1', where: 'S1', minutes: 0 }] }))).not.toContain('zapas');
});
test('Notatki od L. dopiero po przyjęciu', () => {
  expect(notesView(m3StartState()).cards.map(c => c.id)).not.toContain('m3mail');
  const n = notesView(accepted().state);
  expect(n.title).toBe('Notatki · zlecenie L.');
  expect(n.intro).toBe('Od L. Czytanie nic nie kosztuje.');
  expect(n.cards.map(c => c.src)).toEqual(['Mail od L.', 'Plan 7. piętra (od L.)']);
  expect(n.footer).toContain('siedmiu lokatorów');
});
test('blokada oferty W. przy przyjętym L.', () => {
  const s = accepted().state;
  expect(isBlocked(s, 'w')).toBe(true);
  expect(acceptOffer(s, 'w').state).toBe(s);
  expect(visibleOffers(m3StartState())).toContain('m3');
});
