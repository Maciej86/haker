import { expect, test } from 'vitest';
import type { FileRef, GameState } from '../../../src/engine/types';
import { runLine } from '../../../src/engine/terminal';
import { realtimeTick } from '../../../src/engine/realtime';
import { deliver, replyBox } from '../../../src/engine/delivery';
import { helpGroups } from '../../../src/engine/help';
import { devJumps } from '../../../src/engine/dev';
import { missionDef, stageIndex } from '../../../src/engine/missions';
import { wJudge } from '../../../src/missions/w/server';
import { at, found, onBank } from './helpers';

const got = (path: string) => { const s = runLine(at(onBank(), path.replace(/\/[^/]+$/, '') || '/'), `get ${path.split('/').pop()}`).state;
  return runLine(runLine(realtimeTick(s, 10_000).state, 'disconnect').state, 'disconnect').state; };
const send = (s: GameState, name: string) => deliver(s, 'w', 'W załączniku zestawienie.', `10.42.7.12:${name}`);
test('pole odpowiedzi W.', () => {
  expect(replyBox(onBank(), 'w')).toEqual({ title: 'Odpowiedz W.', text: 'W załączniku zestawienie.', button: 'Wyślij', cost: 1, attach: true, emptyAttach: 'pusto: pobierz plik z serwera (get)' });
});
test('zły plik: FINAL nie przeszedł przez zarząd', () => {
  const s = got('/finanse/zestawienia/2026/zestawienie_oddzialow_2026_FINAL.xlsx'); const r = send(s, 'zestawienie_oddzialow_2026_FINAL.xlsx');
  expect(s.downloads.map(f => f.name)).toEqual(['zestawienie_oddzialow_2026_FINAL.xlsx']);
  expect(r.state.t).toBe(s.t + 1);
  expect(r.state.mail.threads.w.at(-1)).toMatchObject({ from: 'W.', bad: true, html: '„FINAL” nie znaczy zatwierdzone. Ta wersja nie przeszła przez zarząd.' });
  expect(r.state.done).not.toContain('w');
});
test('dobry plik: wersja przyjęta przez zarząd, koniec zlecenia', () => {
  const r = send(got('/finanse/zestawienia/2026/zestawienie_oddzialow_2026_v2.xlsx'), 'zestawienie_oddzialow_2026_v2.xlsx');
  expect(r.state.mail.threads.w.at(-1)!.html).toBe('Jest, wersja przyjęta przez zarząd. Dobra robota. Przelew poszedł.');
  // po końcu zlecenia fokus przechodzi na następną ofertę, więc etap W. czytamy z jej definicji
  expect(r.state.done).toContain('w'); expect(missionDef('w').stageIndex(r.state)).toBe(7);
});
test('protokół i notatka: odpowiedzi z makiety', () => {
  expect(wJudge(onBank(), { name: 'protokol_2026-10-20.pdf' } as FileRef).reply).toBe('Protokół, nie zestawienie. Ale dobrze, że już wiesz, czego szukać.');
  expect(wJudge(onBank(), { name: 'sernik.txt' } as FileRef).reply).toBe('To nie jest zestawienie oddziałów. Szukaj dalej.');
  expect(wJudge(onBank(), { name: 'kopia_serwera_2026-11-06.zip' } as FileRef)).toEqual({ ok: true, reply: 'Cała kopia serwera? Odważnie. Znalazłem, czego trzeba. Przelew poszedł.' });
  expect(wJudge(onBank(), { name: 'zestawienie_oddzialow_2025.xlsx' } as FileRef)).toEqual({ ok: false, reply: 'To zestawienie z zeszłego roku. Potrzebuję tegorocznego.' });
  expect(wJudge(onBank(), { name: 'nie_ma_takiego.xlsx' } as FileRef).reply).toBe('To nie jest zestawienie oddziałów. Szukaj dalej.');
});
test('Ściąga „Na serwerze” po włamaniu', () => {
  const g = (x: GameState) => helpGroups(x).find(h => h.group.title === 'Na serwerze')!;
  expect([g(found()).unlocked, g(onBank()).unlocked, g(onBank()).group.need]).toEqual([false, true, 'po włamaniu']);
  expect(g(onBank()).group.entries.map(e => e.cmd)).toEqual(['mc', 'ls', 'cd finanse', 'info &lt;plik&gt;', 'cat &lt;plik&gt;', 'get &lt;plik&gt;', 'edit &lt;plik&gt;', 'disconnect']);
});
test('skok W. na serwerze', () => {
  const s = devJumps().find(j => j.id === 'w-on-server')!.make();
  expect(devJumps().find(j => j.id === 'w-on-server')!.label).toBe('W. na serwerze');
  expect(s.terminal.location).toEqual({ kind: 'host', ip: '10.42.7.12', path: '/', via: 'S1' });
  expect(stageIndex(s)).toBe(6);
});
