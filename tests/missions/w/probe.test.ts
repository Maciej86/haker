import { expect, test } from 'vitest';
import type { GameState } from '../../../src/engine/types';
import { acceptOffer, missionDef } from '../../../src/engine/missions';
import { runLine } from '../../../src/engine/terminal';
import { helpGroups } from '../../../src/engine/help';
import { netNodes } from '../../../src/engine/network';
import { deserialize, serialize } from '../../../src/engine/state';
import { wStartState } from '../../../src/missions/w/dev';
import { run, txt } from '../kuba/helpers';

// gotowy: po przyjęciu, podsłuch przy S1, `use S1` i `scan` (koszty planu 05: 2/1 i 3/2)
const ready = () => run({ ...acceptOffer(wStartState(), 'w').state, t: 16 * 60 + 5,
  devices: [{ id: 'bug1', where: 'S1', minutes: 60 }] }, 'use S1', 'scan').state;
const mins = (s: GameState) => s.devices[0].minutes;

test('pudło kosztuje 6 min gry i 3 min urządzenia', () => {
  const s = ready(); const r = runLine(s, 'probe 10.42.7.5');
  expect(r.state.t - s.t).toBe(6); expect(mins(s) - mins(r.state)).toBe(3);
  expect(txt(r)).toContain('<span class="r">10.42.7.5 to komputer kasjera, sala obsługi. Nie to.</span> <span class="d">Stracono 6 min gry i 3 min urządzenia.</span>');
  expect(r.ui).toContainEqual({ kind: 'toast', text: 'Pudło: komputer kasjera, sala obsługi. −6 min gry, −3 min urządzenia', bad: true });
  expect(r.state.mission.w.found).toBe(false);
});
test('trafienie za pierwszym razem: +0,5 Sieć', () => {
  const r = runLine(ready(), 'probe 10.42.7.12');
  expect(r.state.mission.w.found).toBe(true);
  expect(r.state.skills['Sieć']).toBe(2.5);
  expect(r.state.gains).toContainEqual({ sk: 'Sieć', v: 0.5, why: 'cel trafiony za pierwszym razem' });
  expect(txt(r)).toContain('<span class="c">10.42.7.12 to serwer plików centrali. Serwer plików, chroniony hasłem.</span>');
  expect(txt(r)).toContain('<span class="y">Cel znaleziony.</span>');
  expect(r.ui).toContainEqual({ kind: 'toast', text: 'Cel znaleziony · krok „Znalezienie celu” zaliczony' });
});
test('trafienie po pudle: +0,3 Sieć', () => {
  const r = run(ready(), 'probe 10.42.7.20', 'probe 10.42.7.12');
  expect(r.state.skills['Sieć']).toBe(2.3);
  expect(r.state.gains).toContainEqual({ sk: 'Sieć', v: 0.3, why: 'znalezienie celu' });
});
test('po znalezieniu: „Cel już znaleziony.” bez kosztu i bez przyrostu', () => {
  const s = runLine(ready(), 'probe 10.42.7.12').state;
  for (const ip of ['10.42.7.31', '10.42.7.12']) {
    const r = runLine(s, `probe ${ip}`);
    expect([r.state.t, mins(r.state), r.state.skills['Sieć']]).toEqual([s.t, mins(s), 2.5]);
    expect(txt(r)).toContain('Cel już znaleziony.');
  }
});
test('dane dla NetMap i Ściągi', () => {
  const net = missionDef('w').network!;
  const s = ready(); const f = runLine(s, 'probe 10.42.7.12').state;
  const node = (ip: string) => netNodes(s).find(n => n.ip === ip)!;
  expect([net.isTarget!(s, node('10.42.7.12')), net.isTarget!(s, node('10.42.7.20'))]).toEqual([true, false]);
  expect([net.targetFound!(s), net.targetFound!(f)]).toEqual([false, true]);
  expect(net.side!(s).top).toBeUndefined();
  expect(net.side!(f).top!.buttons).toEqual([{ label: 'Włam się w Terminalu ›', hint: 'wpisze <code>crack 10.42.7.12</code>', cmd: 'crack 10.42.7.12' }]);
  const crack = (x: GameState) => helpGroups(x).find(g => g.group.title === 'Włamanie')!;
  expect([crack(s).unlocked, crack(f).unlocked, crack(f).group.need]).toEqual([false, true, 'po znalezieniu celu']);
});
test('trafienie przetrwa zapis', () => {
  const f = run(ready(), 'probe 10.42.7.5', 'probe 10.42.7.12').state;
  const back = deserialize(serialize(f))!;
  expect(back.mission.w.found).toBe(true);
  expect(back.net.checked).toEqual(['10.42.7.5', '10.42.7.12']);
});
