import { afterEach, expect, it } from 'vitest';
import { barLabel, termMissionLabel, termStepLabel, notesView, appBadge, goMap } from '../../src/engine/desktop';
import { missionDef, stageView } from '../../src/engine/missions';
import { markRead } from '../../src/engine/mail';
import { game, withMission } from './fixtures';
import { day2 } from '../helpers/states';

let restore = () => {};
afterEach(() => restore());

it('nowa gra: Kuba w centrum uwagi', () => {
  expect(barLabel(game())).toBe(missionDef('kuba').barName);
  expect(termMissionLabel(game())).toBe('playlista z imprezy (Kuba)');
});
it('termLabel z danych ma pierwszeństwo', () => { restore = withMission('kuba', { termLabel: 'X' }); expect(termMissionLabel(game())).toBe('X'); });
it('drugi dzień bez przyjętej oferty', () => {
  expect(barLabel(day2())).toBe('Oferta w Poczcie'); expect(termMissionLabel(day2())).toBe('nowe zlecenie w Poczcie');
  expect(termStepLabel(day2())).toBe('przeczytaj ofertę w Poczcie');
});
it('linijka kroku: termStep, potem etap, potem koniec misji', () => {
  restore = withMission('kuba', { termStep: () => 'przeczytaj mail od Kuby' });
  expect(termStepLabel(game())).toBe('przeczytaj mail od Kuby');
  restore(); restore = withMission('kuba', { termStep: undefined });
  expect(termStepLabel(game())).toBe(stageView(game()).find(x => x.state === 'now')!.sub);
  expect(termStepLabel(game({ summaryMeta: { log: [], xp: 80, money: 300, next: 'nextDay' } }))).toBe('zlecenie zakończone');
  expect(termStepLabel(game({ summaryMeta: { log: [], xp: 0, money: 0, next: 'retry' } }))).toBe('zlecenie nieudane');
});
it('notatki: intro, warunek, stopka, brak misji', () => {
  const card = { id: 'ip', src: 'pon 18:40 · u Zenka w piekarni', html: 'IP', insert: 'connect 83.21.40.17' };
  restore = withMission('kuba', { notes: [card, { id: 'x', src: 'x', html: 'ukryta', when: () => false }], notesFooter: 'stopka' });
  expect(notesView(game())).toEqual({ title: 'Notatki', intro: 'Twoje notatki. Czytanie nic nie kosztuje.', cards: [card], footer: 'stopka' });
  expect(notesView(day2()).intro).toBe('Brak notatek. Przyjmij zlecenie w Poczcie.');
});
it('plakietki', () => {
  expect(appBadge(game(), 'mail')).toBe('1'); expect(appBadge(markRead(game(), 'kuba'), 'mail')).toBeNull();
  restore = withMission('kuba', { appBadges: () => ['darknet', 'map'] });
  expect(appBadge(game(), 'darknet')).toBe('!'); expect(appBadge(game(), 'map')).toBe('!'); expect(appBadge(game(), 'browser')).toBeNull();
});
it('Mapa: otwiera się także w misji Kuby', () => {
  expect(goMap(game()).state.screen).toBe('mapPoland');
  expect(goMap({ ...day2(), active: 'w' }).state.screen).toBe('mapPoland');
  expect(missionDef('kuba')?.noTripText).toBe('Do Zenka nie musisz jechać: znasz IP jego serwera.');
});
