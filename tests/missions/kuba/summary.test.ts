import { expect, test } from 'vitest';
import type { GameState } from '../../../src/engine/types';
import { deliver } from '../../../src/engine/delivery';
import { missionDef } from '../../../src/engine/missions';
import { unlockedThemes } from '../../../src/engine/profile';
import { serialize, deserialize } from '../../../src/engine/state';
import { kubaAccepted, withKuba, run } from './helpers';

// 20:33 po przyjęciu → connect po złamaniu 20:34 → wysłanie 20:35
const ready = (...after: string[]) =>
  run(withKuba({ ...kubaAccepted(), money: 0, owned: ['cpu1', 'net2', 'wyt'] }, { conn: true, cracked: true }),
    'connect 83.21.40.17', 'get playlista.txt', ...after).state;
const send = (s: GameState) => deliver(s, 'kuba', 'Proszę bardzo.', '83.21.40.17:playlista.txt').state;

test('nagroda: 300 ¤, +80 XP, done, overlay, motyw Neon, log z doneLog', () => {
  const s = send(ready('disconnect'));
  expect([s.money, s.xp, s.lvl, s.active, s.overlay]).toEqual([300, 120, 1, null, 'summary']);
  expect(s.done).toEqual(['kuba']);
  expect(unlockedThemes(s.done.length)).toContain('neon');
  expect(s.summary).toEqual(expect.arrayContaining([
    { label: 'Nagroda za zlecenie', value: '300 ¤', tone: 'ok' },
    { label: '✓ Rozłączony z serwerem przed wysłaniem', value: 'dobry nawyk', tone: 'ok' },
    { label: 'Odblokowano: motyw Neon (Start → Motyw)', value: '', tone: 'ok' },
    { label: 'Czas: śr 20:35 · Wytrych 1.0 zostaje na pulpicie', value: '' },
  ]));
  expect(s.summaryMeta).toEqual({ log: missionDef('kuba').doneLog, xp: 80, money: 300, next: 'nextDay' });
  expect(s.summaryMeta!.log).toEqual(['> Plik dostarczony: playlista.txt', '> Kuba potwierdził odbiór.', '> Misja 1 zakończona.']);
  expect('summaryLog' in s).toBe(false);
});
test('wysłane z serwera: nawyk niespełniony, kwota ta sama', () => {
  const s = send(ready());
  expect(s.summary).toContainEqual({ label: '· Rozłączony z serwerem przed wysłaniem', value: 'dobry nawyk' });
  expect(s.money).toBe(300);
});
test('overlay przetrwa odświeżenie', () => {
  const s = send(ready('disconnect')); const b = deserialize(serialize(s))!;
  expect([b.overlay, b.summary, b.summaryMeta]).toEqual([s.overlay, s.summary, s.summaryMeta]);
});
