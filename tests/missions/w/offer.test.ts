import { expect, test } from 'vitest';
import type { GameState } from '../../../src/engine/types';
import { acceptOffer, appBadges, isBlocked, missionDef, visibleOffers } from '../../../src/engine/missions';
import { initWState } from '../../../src/missions/w/state';
import { W_ANSWER } from '../../../src/missions/w/texts';
import { wStartState } from '../../../src/missions/w/dev';
import { txt } from '../kuba/helpers';

const accepted = (p: Partial<GameState> = {}) => acceptOffer({ ...wStartState(), ...p }, 'w');

test('initWState', () => { expect(initWState()).toMatchObject({ found: false }); });
test('start W.: czw 13:50, 300 ¤, oferta W. nieprzeczytana', () => {
  const s = wStartState();
  expect([s.day, s.t, s.money, s.xp, s.lvl, s.active]).toEqual(['czw', 830, 300, 120, 1, null]);
  expect(s.skills).toEqual({ 'Sieć': 2, 'Linux': 2, 'Skrypty': 0, 'Social': 1 });
  expect(s.owned).toEqual(['cpu1', 'net2', 'wyt']);
  expect([s.devices, s.done, s.hintsUsed]).toEqual([[], ['kuba'], 0]);
  expect(visibleOffers(s)).toContain('w');
  expect(s.mail.read).not.toContain('w');
  expect(s.dayCheckpoint).toMatchObject({ day: 'czw', t: 830 });
});
test('oferta: termin dziś 19:00, 2500 ¤', () => {
  const d = missionDef('w');
  expect(d.offer).toMatchObject({ subject: 'Zestawienie oddziałów', when: '{dzień} 13:50', reward: 2500,
    levelLabel: 'Poziom 2', acceptReply: 'Zdobędę dla Ciebie ten plik.', acceptCost: 1 });
  expect(d.offer.body).toHaveLength(3);
  expect(d.offer.body[2]).toContain('<b>dziś 19:00</b>');
  expect(d.deadline).toEqual({ time: 1140 });
  expect(d.trip).toMatchObject({ city: 'Poznań', packageFrom: 'W.', deadline: 1140 });
  expect(d.notesTitle).toBe('Notatki · zlecenie Banku Wiślanego');
  expect(appBadges(accepted().state)).toEqual(['map']);
  expect(d.notes.map(n => n.src)).toEqual(['Mail od W.', 'Telefon do centrali', 'Konto klienta · route bank']);
  expect(d.hints!.map(h => h.price)).toEqual([15, 30, 60]);
});
test('przyjęcie: 1 + 2 min, wątek, odpowiedź W., linia w Terminalu', () => {
  const r = accepted();
  expect(r.state.t).toBe(833);
  expect(r.state.active).toBe('w');
  expect(r.state.mail.threads.w.map(m => [m.from, m.when])).toEqual([['Ty', 'czw 13:51'], ['W.', 'czw 13:53']]);
  expect(r.state.mail.threads.w[1].html).toBe(W_ANSWER);
  expect(W_ANSWER).toContain('pod ławką na przystanku autobusowym obok banku');
  expect(r.ui[0]).toMatchObject({ kind: 'mailArrives', thread: 'w', delayMs: 1200 });
  expect(txt(r)).toContain('<span class="c">Zlecenie przyjęte.</span> Cel: centrala Banku Wiślanego, Poznań.');
  expect(txt(r)).not.toContain('Sprawdź: devices');
  expect(r.state.net.reusedBug).toBe(false);
});
test('PODSŁUCH-1 przy S1 z zapasem: reusedBug i linia o zapasie (bez porady „Sprawdź: devices”)', () => {
  const r = accepted({ devices: [{ id: 'bug1', where: 'S1', minutes: 41 }] });
  expect(r.state.net.reusedBug).toBe(true);
  expect(txt(r)).toContain('wisi już Twój PODSŁUCH-1 (zapas 41 min).</span>');
  expect(txt(r)).not.toContain('Sprawdź: devices');
});
test('PODSŁUCH-1 przy S1 wyczerpany: zwykła ścieżka', () => {
  const r = accepted({ devices: [{ id: 'bug1', where: 'S1', minutes: 0 }] });
  expect(r.state.net.reusedBug).toBe(false);
  expect(txt(r)).not.toContain('PODSŁUCH-1 (zapas');
});
test('blokada oferty L. przy przyjętym W.', () => {
  const s = accepted().state;
  expect(isBlocked(s, 'm3')).toBe(true);
  expect(acceptOffer(s, 'm3').state).toBe(s);
  expect(acceptOffer(s, 'w').state).toBe(s);
});
