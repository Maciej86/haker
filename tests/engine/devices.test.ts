import { expect, test } from 'vitest';
import { bug, bugAtS1, useDevice, spend, buyBug, bugTripOffer, tripAgain } from '../../src/engine/devices';
import { isLinkedToS1 } from '../../src/engine/commands/basic';
import { afterKuba, atS1, inPack, linked } from './netHelpers';
const txt = (r: any) => r.lines.map((l: any) => l.html).join('\n');

test('bugAtS1 wymaga S1 i zapasu > 0', () => {
  expect(bugAtS1(afterKuba([atS1(5)]))).toBe(true);
  expect(bugAtS1(afterKuba([atS1(0)]))).toBe(false);
  expect(bugAtS1(afterKuba([inPack()]))).toBe(false);
  expect(bug(afterKuba([inPack()]))!.where).toBe('plecak');
});
test('useDevice odejmuje i nie schodzi poniżej 0', () => {
  expect(useDevice(afterKuba([atS1(10)]), 3).state.devices[0].minutes).toBe(7);
  const r = useDevice(linked(afterKuba([atS1(2)])), 3);
  expect(r.state.devices[0].minutes).toBe(0);
  expect(r.state.terminal.location).toEqual({ kind: 'home' });
  expect(txt(r)).toContain('PODSŁUCH-1 wyczerpany. Połączenie z siecią za S1 zerwane.');
  expect(r.ui).toEqual(expect.arrayContaining([{ kind: 'toast', text: 'PODSŁUCH-1 wyczerpany', bad: true }, { kind: 'stopTimer', timer: 'download' }, { kind: 'stopTimer', timer: 'crackTrace' }]));
  expect(useDevice(r.state, 1).lines).toEqual([]);
});
test('zerwanie z serwera przez S1 wraca do domu', () => {
  const s0 = afterKuba([atS1(1)]);
  const s = { ...s0, terminal: { ...s0.terminal, location: { kind: 'host' as const, ip: '10.42.7.12', path: '/', via: 'S1' as const } } };
  expect(isLinkedToS1(s)).toBe(true);
  expect(useDevice(s, 1).state.terminal.location).toEqual({ kind: 'home' });
});
test('spend: czas gry i urządzenia', () => {
  const s = afterKuba([atS1(60)]); const r = spend(s, 6, 3);
  expect(r.state.t).toBe(s.t + 6); expect(r.state.devices[0].minutes).toBe(57);
});
test('buyBug: do plecaka, drugi odmowa', () => {
  const r = buyBug(afterKuba([atS1(0)]));
  expect(r.state.devices).toContainEqual({ id: 'bug1', where: 'plecak', minutes: 60 });
  expect(bugTripOffer(r.state)).toBe(true);
  const again = buyBug(r.state);
  expect(again.state.devices).toHaveLength(2);
  expect(again.ui).toContainEqual({ kind: 'toast', text: 'Masz już nowy PODSŁUCH-1 w plecaku.', bad: true });
});
test('tripAgain: 110 min, 58 ¤, nowy przy S1 z 60 min', () => {
  const s = { ...afterKuba([atS1(0), inPack()]), t: 1000 }; const r = tripAgain(s);
  expect(r.state.t).toBe(1110); expect(r.state.money).toBe(242);
  expect(r.state.devices).toEqual([{ id: 'bug1', where: 'S1', minutes: 60 }]);
  expect(txt(r)).toContain('wróciłeś. Nowy PODSŁUCH-1 podpięty w szafce przy S1.');
  expect(bugTripOffer(r.state)).toBe(false);
});
test('tripAgain bez pieniędzy', () => {
  const s = { ...afterKuba([atS1(0), inPack()]), money: 50 }; const r = tripAgain(s);
  expect(r.state).toBe(s); expect(r.ui).toContainEqual({ kind: 'toast', text: 'Brakuje 8 ¤ na dojazd.', bad: true });
});
