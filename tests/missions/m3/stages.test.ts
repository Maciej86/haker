import { expect, test } from 'vitest';
import type { GameState } from '../../../src/engine/types';
import { acceptOffer, appBadges, coachLine, missionDef, stageIndex, stageView, termStep } from '../../../src/engine/missions';
import { M3_STAGES } from '../../../src/missions/m3/texts';
import { m3StartState } from '../../../src/missions/m3/dev';
import '../../../src/missions';

const acc = (p: Partial<GameState> = {}) => ({ ...acceptOffer(m3StartState(), 'm3').state, ...p });
const bugS1 = (m = 60) => [{ id: 'bug1' as const, where: 'S1' as const, minutes: m }];
const net = (s: GameState, n: Partial<GameState['net']>) => ({ ...s, net: { ...s.net, ...n } });

test('7 etapów z makiety', () => {
  expect(M3_STAGES.map(x => x.title)).toEqual(['Przyjęcie zlecenia', 'Wyjazd i podłożenie podsłuchu', 'Połączenie z podsłuchem',
    'Kamery na trasie', 'Okno 21:14: do 712', 'Powrót z 712', 'Raport dla L.']);
});
test('kolejne etapy i linijki', () => {
  const cases: [GameState, number, string][] = [
    [acc(), 1, 'otwórz Mapę i znajdź wieżowiec'],
    [acc({ screen: 'trip' }), 1, 'otwórz Mapę i znajdź wieżowiec'],
    [acc({ devices: bugS1() }), 2, 'połącz się z PODSŁUCH-1 (use S1)'],
    [acc({ devices: bugS1(), terminal: { ...acc().terminal, location: { kind: 'S1' } } }), 3, 'następny krok: znajdź cel w sieci za S1'],
    [net(acc({ devices: bugS1() }), { scanned: true, checked: ['10.42.5.31'] }), 3, 'znajdź cel: scan, NetMap, probe'],
    [net(acc({ devices: bugS1() }), { scanned: true, checked: ['10.42.5.33', '10.42.5.31'] }), 4, 'zaplanuj kamery na 21:14 (at), potem disconnect i wait'],
  ];
  for (const [s, i, line] of cases) { expect(stageIndex(s)).toBe(i); expect(termStep(s)).toBe(line); expect(coachLine(s)).toBe(M3_STAGES[i].coach); }
  expect(missionDef('m3').stageIndex({ ...acc(), done: ['kuba', 'm3'], active: null })).toBe(7);
  expect(missionDef('m3').stageIndex(m3StartState())).toBe(0);
  expect(missionDef('m3').termStep!(m3StartState())).toBe('przeczytaj mail od L.');
  expect(missionDef('m3').termStep!({ ...acc(), done: ['kuba', 'm3'], active: null })).toBe('zlecenie zakończone');
});
test('po skanie etap nie cofa się, gdy podsłuch padł', () => {
  expect(stageIndex(net(acc({ devices: bugS1(0) }), { scanned: true }))).toBe(3);
});
test('podsłuch już przy S1: wyjazd pominięty; ucieczka: jedź jeszcze raz', () => {
  const s = acceptOffer({ ...m3StartState(), devices: bugS1(41) }, 'm3').state;
  expect(stageIndex(s)).toBe(2);
  expect(stageView(s)[1]).toMatchObject({ mark: '✓', sub: 'pominięte: PODSŁUCH-1 już wisiał przy S1' });
  const fled = acc({ trip: { mission: 'm3', last: 'fled', trips: 1, suspicious: true }, devices: [{ id: 'bug1', where: 'plecak', minutes: 60 }] });
  expect(stageIndex(fled)).toBe(1);
  expect(stageView(fled)[1].sub).toBe('nieudane, jedź jeszcze raz');
  expect(stageView(acc())[1].sub).toBe('paczka z przystanku, skrzynka S1');
});
test('wyjazd L.: termin 21:14, paczka od L.; „!” na Mapie tylko przed wyjazdem', () => {
  expect(missionDef('m3').trip).toMatchObject({ city: 'Poznań', packageFrom: 'L.', deadline: 1274, tripStage: 1,
    mapLabel: 'Hotel Luksus, 7. piętro, wieżowiec w centrum Poznania' });
  expect(missionDef('m3').trip!.progress).toHaveLength(5);
  expect(appBadges(acc())).toContain('map');
  expect(appBadges(acc({ devices: bugS1() }))).not.toContain('map');
});
