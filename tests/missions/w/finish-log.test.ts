import { expect, test } from 'vitest';
import type { GameState } from '../../../src/engine/types';
import { runLine } from '../../../src/engine/terminal';
import { realtimeTick } from '../../../src/engine/realtime';
import { acceptOffer } from '../../../src/engine/missions';
import { editorAct } from '../../../src/engine/mc';
import { logMe } from '../../../src/engine/server';
import { wStartState } from '../../../src/missions/w/dev';
import { at, cleanLog, gotV2, home, sendV2 } from './helpers';

const LOGS = 'Wyczyszczone logi serwera (bez śladów)';
const bonus = (s: GameState) => s.summary!.find(r => r.label.endsWith(LOGS))!;

test('usunięte tylko własne wiersze: +300 ¤, pełna pula 3400 ¤', () => {
  const r = sendV2(home(cleanLog(gotV2())));
  expect(bonus(r.state)).toEqual({ label: '✓ ' + LOGS, value: '+300 ¤', tone: 'ok' });
  expect(r.state.summaryMeta!.money).toBe(3400);
  expect(r.state.srv.log).toHaveLength(5);                       // pięć wierszy banku zostało
});

test('usunięty cudzy wiersz: brak premii, czujny bank, wiersz w podsumowaniu', () => {
  let s = runLine(at(gotV2(), '/it/logi'), 'edit auth.log').state;
  s = editorAct(editorAct(s, { kind: 'del', index: 0 }).state, { kind: 'save' }).state;
  const r = sendV2(home(cleanLog(s)));
  expect(bonus(r.state)).toEqual({ label: '· ' + LOGS, value: '—' });
  expect(r.state.summary).toContainEqual({ label: 'W logu brakuje cudzych wpisów. Bank coś zauważył.', value: '', tone: 'bad' });
  expect(r.state.summary).toContainEqual({ label: '· Ani razu nie namierzony', value: '—' });
});

test('rm auth.log: brak premii i czujny bank', () => {
  const r = sendV2(home(runLine(at(gotV2(), '/it/logi'), 'rm auth.log').state));
  expect(bonus(r.state).label.startsWith('·')).toBe(true);
  expect(r.state.summary).toContainEqual({ label: 'W logu brakuje cudzych wpisów. Bank coś zauważył.', value: '', tone: 'bad' });
});

test('log bez edycji: brak premii', () => {
  expect(bonus(sendV2(home(gotV2())).state).label.startsWith('·')).toBe(true);
});

test('sprzątnięty log, potem kolejne pobranie: nowy wiersz, brak premii', () => {
  const c = cleanLog(gotV2());
  const again = realtimeTick(runLine(at(c, '/finanse/zestawienia/2026'), 'get zestawienie_oddzialow_2026_FINAL.xlsx').state, 10_000).state;
  expect(again.srv.log.at(-1)).toMatchObject({ me: true, t: expect.stringContaining('pobranie: zestawienie_oddzialow_2026_FINAL.xlsx') });
  expect(bonus(sendV2(home(again)).state).label.startsWith('·')).toBe(true);
});

test('daty w auth.log z bieżącego dnia (W. jako druga oferta w piątek)', () => {
  const s = acceptOffer({ ...wStartState(), day: 'pt' }, 'w').state;
  expect(s.srv.log.every(l => l.t.startsWith('pt '))).toBe(true);
  expect(logMe(s, 'dostęp do serwera plików').srv.log.at(-1)!.t.startsWith('pt ')).toBe(true);
});
