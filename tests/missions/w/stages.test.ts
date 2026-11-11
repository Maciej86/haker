import { expect, test } from 'vitest';
import type { GameState } from '../../../src/engine/types';
import { acceptOffer, coachLine, missionDef, stageIndex, stageView, termStep } from '../../../src/engine/missions';
import { deadlineLabel } from '../../../src/engine/clock';
import type { WState } from '../../../src/missions/w/state';
import { W_STAGES } from '../../../src/missions/w/texts';
import { wStartState } from '../../../src/missions/w/dev';
import '../../../src/missions';

const acc = (p: Partial<GameState> = {}) => ({ ...acceptOffer(wStartState(), 'w').state, ...p });
const bugS1 = (m = 60) => [{ id: 'bug1' as const, where: 'S1' as const, minutes: m }];
const withW = (s: GameState, w: Partial<WState>) => ({ ...s, mission: { ...s.mission, w: { ...s.mission.w, ...w } } });

test('7 etapów z makiety', () => {
  expect(W_STAGES.map(x => x.title)).toEqual(['Przyjęcie zlecenia', 'Rozpoznanie: cel na mapie', 'Wyjazd i podłożenie podsłuchu',
    'Połączenie z podsłuchem', 'Znalezienie celu', 'Włamanie', 'Oddanie zlecenia']);
});
test('przed przyjęciem: etap 0, linijka o mailu (dwie oferty: brak misji w fokusie)', () => {
  expect(missionDef('w').stageIndex(wStartState())).toBe(0);
  expect(missionDef('w').termStep!(wStartState())).toBe('przeczytaj mail od W.');
  expect(termStep(wStartState())).toBeNull();
});
test('kolejne etapy i linijki', () => {
  const cases: [GameState, number, string][] = [
    [acc(), 1, 'otwórz Mapę i znajdź bank w Poznaniu'],
    [acc({ screen: 'trip' }), 2, 'otwórz Mapę i znajdź bank w Poznaniu'],
    [acc({ devices: bugS1() }), 3, 'połącz się z PODSŁUCH-1 (use S1)'],
    [acc({ devices: bugS1(), terminal: { ...acc().terminal, location: { kind: 'S1' } } }), 4, 'następny krok: znajdź cel w sieci za S1'],
    [acc({ devices: bugS1(), net: { ...acc().net, scanned: true } }), 4, 'znajdź cel: scan, NetMap, probe'],
    [withW(acc({ devices: bugS1(), terminal: { ...acc().terminal, location: { kind: 'S1' } } }), { found: true }), 5, 'następny krok: włamanie do 10.42.7.12'],
    // plan 22 [decyzja]: od etapu 5 bez połączenia z S1 (też po zwykłym rozłączeniu) linijka każe się połączyć
    [withW(acc({ devices: bugS1() }), { found: true }), 5, 'połącz się z PODSŁUCH-1 (use S1)'],
  ];
  for (const [s, i, line] of cases) { expect(stageIndex(s)).toBe(i); expect(termStep(s)).toBe(line); expect(coachLine(s)).toBe(W_STAGES[i].coach); }
  expect(missionDef('w').stageIndex({ ...acc(), done: ['kuba', 'w'], active: null })).toBe(7);
  expect(missionDef('w').termStep!({ ...acc(), done: ['kuba', 'w'], active: null })).toBe('zlecenie zakończone');
});
test('po skanie etap nie cofa się, gdy podsłuch padł', () => {
  expect(stageIndex(acc({ devices: bugS1(0), net: { ...acc().net, scanned: true } }))).toBe(4);
});
test('podsłuch już przy S1: wyjazd pominięty', () => {
  const s = acceptOffer({ ...wStartState(), devices: bugS1(41) }, 'w').state;
  expect(stageIndex(s)).toBe(3);
  expect(stageView(s)[2]).toMatchObject({ mark: '✓', sub: 'pominięte: PODSŁUCH-1 już wisiał przy S1' });
  expect(stageView(acc({ devices: bugS1() }))[2].sub).toBe('paczka z przystanku, skrzynka S1');
});
test('nieudany wyjazd: podpis etapu 2', () => {
  const s = acc({ trip: { ...acc().trip, mission: 'w', last: 'fled' } });
  expect(stageView(s)[2].sub).toBe('nieudane, jedź jeszcze raz');
});
test('termin w pasku tylko po przyjęciu', () => {
  expect(deadlineLabel(wStartState())).toBeNull();
  expect(deadlineLabel(acc())).toEqual({ text: 'czw 19:00 · zostało 5 h 7 min', red: false });
  expect(deadlineLabel(acc({ t: 18 * 60 + 35 }))).toEqual({ text: 'czw 19:00 · zostało 25 min', red: true });
});
