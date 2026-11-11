import { expect, test } from 'vitest';
import type { GameState } from '../../../src/engine/types';
import { acceptOffer, missionDef, stageIndex } from '../../../src/engine/missions';
import { isTarget, netNodes } from '../../../src/engine/network';
import { runLine } from '../../../src/engine/terminal';
import { deserialize, serialize } from '../../../src/engine/state';
import { m3StartState } from '../../../src/missions/m3/dev';
import { run, txt } from '../kuba/helpers';
import '../../../src/missions';

// gotowy: po przyjęciu, podsłuch przy S1, `use S1` i `scan`
const ready = () => run({ ...acceptOffer(m3StartState(), 'm3').state, t: 17 * 60 + 30,
  devices: [{ id: 'bug1', where: 'S1', minutes: 60 }] }, 'use S1', 'scan').state;
const mins = (s: GameState) => s.devices[0].minutes;

test('kamery p. 7 widoczne w scan, za 10.42.5.17', () => {
  const s = ready(); const ips = netNodes(s).map(n => n.ip);
  expect(ips).toHaveLength(25);
  const i = ips.indexOf('10.42.5.17');
  expect(ips.slice(i + 1, i + 5)).toEqual(['10.42.5.31', '10.42.5.32', '10.42.5.33', '10.42.5.34']);
  expect(txt(runLine(s, 'scan'))).toContain('10.42.5.31    ◉ kamera    .5.x     cała doba'); // ponowny scan: wynik bez kosztu (plan 05)
});
test('u W. nie ma kamer hotelu', () => {
  const w = acceptOffer(m3StartState(), 'w').state;
  expect(netNodes(w).some(n => n.ip === '10.42.5.31')).toBe(false);
});
test('probe kamery: koszt 6/3, linia, +0,3 Sieć tylko raz', () => {
  const s = ready(); const a = runLine(s, 'probe 10.42.5.31');
  expect([a.state.t - s.t, mins(s) - mins(a.state)]).toEqual([6, 3]);
  expect(txt(a)).toContain('<span class="c">10.42.5.31 to kamera, p. 7, przy windzie (Hotel Luksus).</span> <span class="d">Zaznaczona na planie piętra.</span>');
  expect(a.state.skills['Sieć']).toBe(2.3);
  expect(a.state.gains).toContainEqual({ sk: 'Sieć', v: 0.3, why: 'kamera z 7. piętra znaleziona' });
  const b = runLine(a.state, 'probe 10.42.5.33');
  expect(b.state.skills['Sieć']).toBe(2.3);
  const again = runLine(b.state, 'probe 10.42.5.31');
  expect([again.state.t, mins(again.state)]).toEqual([b.state.t, mins(b.state)]);
});
test('probe urządzenia spoza p. 7: szara linia, bez przyrostu, bez pudła', () => {
  const r = runLine(ready(), 'probe 10.42.5.4');
  expect(txt(r)).toBe('<span class="d">10.42.5.4 to serwer rezerwacji, Hotel Luksus.</span>');
  expect(r.state.skills['Sieć']).toBe(2);
  expect(r.ui.some(e => e.kind === 'toast' && e.bad)).toBe(false);
});
test('trafienie dla NetMap i panel podpowiedzi', () => {
  const s = ready(); const n = (ip: string) => netNodes(s).find(x => x.ip === ip)!;
  expect(['10.42.5.31', '10.42.5.34', '10.42.5.4', '10.42.2.3'].map(ip => isTarget(s, n(ip)))).toEqual([true, true, false, false]);
  expect(missionDef('m3').network!.side!(s).hints!.html).toContain('szukasz kamer z 7. piętra hotelu');
});
test('kamery spoza trasy nie kończą etapu; obie z trasy kończą', () => {
  expect(stageIndex(run(ready(), 'probe 10.42.5.32', 'probe 10.42.5.34', 'probe 10.42.5.31').state)).toBe(3);
  expect(stageIndex(run(ready(), 'probe 10.42.5.33', 'probe 10.42.5.31').state)).toBe(4);
});
test('sprawdzone kamery przetrwają zapis', () => {
  const f = run(ready(), 'probe 10.42.5.31', 'probe 10.42.5.33').state;
  const back = deserialize(serialize(f))!;
  expect(back.net.checked).toEqual(['10.42.5.31', '10.42.5.33']);
  expect(back.mission.m3).toEqual(f.mission.m3);
  expect(stageIndex(back)).toBe(4);
});
