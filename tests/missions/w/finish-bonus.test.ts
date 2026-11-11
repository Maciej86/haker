import { expect, test } from 'vitest';
import type { GameState } from '../../../src/engine/types';
import { gclk } from '../../../src/engine/clock';
import { bug } from '../../../src/engine/devices';
import { initWState } from '../../../src/missions/w/state';
import { gotV2, home, onBank, run, sendV2, txt } from './helpers';

const row = (s: GameState, label: string) => s.summary!.find(r => r.label.endsWith(label));

test('dobry plik po zejściu do domu: 2500 + 300 + 200 + 100, +80 XP, Bursztyn', () => {
  const s = home(gotV2()); const r = sendV2(s);
  expect(r.state).toMatchObject({ money: s.money + 3100, xp: 200, lvl: 2, done: ['kuba', 'w'], active: null, overlay: 'summary' });
  expect(r.state.summary!.slice(0, 4)).toEqual([
    { label: 'Nagroda za zlecenie', value: '2500 ¤', tone: 'ok' },
    { label: '✓ Zapas co najmniej 30 min przed terminem', value: '+300 ¤', tone: 'ok' },
    { label: '✓ Ani razu nie namierzony', value: '+200 ¤', tone: 'ok' },
    { label: '✓ Rozłączony z serwerem przed wysłaniem', value: '+100 ¤', tone: 'ok' }]);
  expect(r.state.summary).toContainEqual({ label: 'Odblokowano: motyw Bursztyn (Start → Motyw)', value: '', tone: 'ok' });
  expect(r.state.summary).toContainEqual({ label: `Czas: ${gclk(r.state)} · PODSŁUCH-1 zostało ${bug(r.state)!.minutes} min (zostaje u Ciebie)`, value: '' });
  expect(r.state.summary!.some(x => x.tone === 'bad')).toBe(false);
  expect(r.state.summaryMeta).toEqual({ log: ['> Plik dostarczony: zestawienie oddziałów.', '> W. potwierdził odbiór.', '> Zlecenie zakończone.'], xp: 80, money: 3100, next: 'nextDay' });
  expect(bug(r.state)!.minutes).toBe(bug(s)!.minutes);
});

test('wysłane z S1: −10 min, wiersz kary, rozłączony z serwerem zaliczony, dom', () => {
  const s = run(gotV2(), 'disconnect').state; const r = sendV2(s);
  expect(bug(r.state)!.minutes).toBe(bug(s)!.minutes - 10);
  expect(r.state.summary).toContainEqual({ label: 'Nie rozłączyłeś się z S1 po wykonaniu zadania. Czas pracy urządzenia zmniejszony o 10 minut.', value: '', tone: 'bad' });
  expect(row(r.state, 'Rozłączony z serwerem przed wysłaniem')!.label.startsWith('✓')).toBe(true);
  expect(r.state.terminal.location).toEqual({ kind: 'home' });
});

test('wysłane z serwera przy zapasie 4 min: zapas 0 bez „wyczerpany”, premia 3 niespełniona, sesja zamknięta', () => {
  const s = { ...gotV2(), devices: [{ id: 'bug1' as const, where: 'S1' as const, minutes: 4 }] };
  const r = sendV2(s);
  expect(bug(r.state)!.minutes).toBe(0);
  expect(txt(r)).not.toContain('PODSŁUCH-1 wyczerpany');
  expect(row(r.state, 'Rozłączony z serwerem przed wysłaniem')).toEqual({ label: '· Rozłączony z serwerem przed wysłaniem', value: '—' });
  expect(r.state.terminal.location).toEqual({ kind: 'home' });
  expect(r.state.srv).toMatchObject({ dl: null, crack: null, editor: null, mc: { open: false, preview: null } });
  expect(r.state.mission.w).toMatchObject({ leftS1: true, sentOnSrv: true });
});

test('namierzony albo czujny bank: bez premii 2', () => {
  for (const p of [{ caught: true }, { alert: true }])
    expect(row(sendV2(home(gotV2(onBank(p)))).state, 'Ani razu nie namierzony')).toEqual({ label: '· Ani razu nie namierzony', value: '—' });
});

test('zapas 30 min: 18:29 → tak, 18:30 → nie (po minucie za wysłanie)', () => {
  const at1829 = sendV2({ ...home(gotV2()), t: 18 * 60 + 29 }).state;
  const at1830 = sendV2({ ...home(gotV2()), t: 18 * 60 + 30 }).state;
  expect(row(at1829, 'Zapas co najmniej 30 min przed terminem')!.label[0]).toBe('✓');
  expect(row(at1830, 'Zapas co najmniej 30 min przed terminem')!.label[0]).toBe('·');
});

test('initWState', () => {
  expect(initWState()).toEqual({ found: false, disc: false, leftS1: false, sentOnSrv: false });
});
