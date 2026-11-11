import { expect, test } from 'vitest';
import type { GameState } from '../../../src/engine/types';
import { acceptOffer, floorPlanView } from '../../../src/engine/missions';
import { deserialize, serialize } from '../../../src/engine/state';
import { camIsOff, offAt } from '../../../src/missions/m3/state';
import { cone } from '../../../src/missions/m3/plan';
import { m3StartState } from '../../../src/missions/m3/dev';
import '../../../src/missions';
import { withM3 } from './helpers';

const acc = () => acceptOffer(m3StartState(), 'm3').state;
const checked = (s: GameState, ips: string[]) => ({ ...s, net: { ...s.net, scanned: true, checked: ips } });

test('przed probe: cztery kamery bez adresów', () => {
  const v = floorPlanView(acc())!;
  expect(v.cams.map(c => [c.ip, c.lbl, c.known, c.off])).toEqual([
    ['10.42.5.31', 'przy windzie', false, false], ['10.42.5.32', 'korytarz A', false, false],
    ['10.42.5.33', 'korytarz B', false, false], ['10.42.5.34', 'schody', false, false]]);
  expect(v.svg).toContain('>? przy windzie<');
  expect(v.svg).toContain('class="room goal"');
  expect(v.svg).toContain('>WINDA<');
  expect(v.rows).toEqual([{ label: 'okno', value: '21:14–21:17 · 3 min', coin: true },
    { label: 'teraz', value: 'czw 13:53' }, { label: 'zadania at', value: 'brak' }]);
  expect(v.footer).toBe('Żółte pole = kamera widzi. Adres kamery poznasz przez <code>probe</code>. Trasa: winda → korytarz B → 712.');
});
test('probe odsłania adres na planie piętra', () => {
  const v = floorPlanView(checked(acc(), ['10.42.5.31', '10.42.5.4']))!;
  expect(v.cams[0]).toMatchObject({ known: true });
  expect(v.svg).toContain('>.31 przy windzie<');
  expect(v.svg).toContain('>? korytarz B<');
});
test('wyłączona kamera, zadania at i druga próba (dane z planu 31)', () => {
  const s = withM3({ ...checked(acc(), ['10.42.5.31']), t: 1274 }, { err: 1, log: [
    { ip: '10.42.5.31', off: 1273, on: null, src: 'man' }, { ip: '10.42.5.33', off: 1274, on: 1277, src: 'at' }] });
  const v = floorPlanView(s)!;
  expect(v.cams.filter(c => c.off).map(c => c.ip)).toEqual(['10.42.5.31', '10.42.5.33']);
  expect(v.svg).toContain('.31 przy windzie · off');
  expect(v.svg).toContain('class="cone off"');
  expect(v.rows[0].value).toBe('21:14–21:17 · 3 min · druga próba');
  expect(v.rows[2].value).toBe('.33 21:14–21:17');
  expect(camIsOff(s.mission.m3, '10.42.5.33', 1277)).toBe(false);
  expect(offAt(s.mission.m3, 1274).map(c => c.ip)).toEqual(['10.42.5.31', '10.42.5.33']);
});
test('kropka i brak planu poza misją', () => {
  expect(floorPlanView(acc(), { x: 300, y: 200, seen: true })!.svg).toContain('class="dot seen"');
  expect(floorPlanView(m3StartState())).toBeNull();
  expect(cone({ x: 0, y: 0, a: 0 }).split(' ')).toHaveLength(3);
});
test('plan po odświeżeniu taki sam', () => {
  const s = checked(acc(), ['10.42.5.33']);
  expect(floorPlanView(deserialize(serialize(s))!)).toEqual(floorPlanView(s));
});
