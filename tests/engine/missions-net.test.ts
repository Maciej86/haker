import { test, expect } from 'vitest';
import { acceptOffer } from '../../src/engine/missions';
import { withMission } from './fixtures';
import { SAMPLE_TRIP } from '../../src/world/trip/sample';
import { nextDay } from '../../src/engine/clock';
import { reusedBugSub, packageWaiting } from '../../src/engine/devices';
import { netNodes, isTarget, probe, scan } from '../../src/engine/network';
import { runLine } from '../../src/engine/terminal';
import { afterKuba, atS1 } from './netHelpers';
const txt = (r: any) => r.lines.map((l: any) => l.html).join('\n');

test('W. z podsłuchem przy S1 (zapas > 0): wyjazd pominięty, jedna linia o podsłuchu', () => {
  const s = acceptOffer(afterKuba([atS1(23)]), 'w').state;
  expect(s.net.reusedBug).toBe(true);
  expect(reusedBugSub(s)).toBe('pominięte: PODSŁUCH-1 już wisiał przy S1');
  expect(packageWaiting(s)).toBe(false);
  const a = runLine(s, 'use S1');
  // „Paczka od W. może poczekać pod ławką.” usunięte w fix round 1 (Terminal nie podpowiada).
  expect(txt(a)).toContain('PODSŁUCH-1 z poprzedniej misji wciąż wisi w szafce przy S1.');
  const b = runLine(runLine(a.state, 'disconnect').state, 'use S1');
  expect(txt(b)).not.toContain('z poprzedniej misji');
  expect(a.state.devices[0].minutes).toBe(22);
});
test('W. z martwym podsłuchem (zapas 0): zwykła droga', () => {
  const s = acceptOffer(afterKuba([atS1(0)]), 'w').state;
  expect(s.net.reusedBug).toBe(false); expect(reusedBugSub(s)).toBeNull();
});
test('przyjęcie zeruje rozpoznanie z poprzedniej misji', () => {
  const base = afterKuba([atS1(60)]);
  const s = acceptOffer({ ...base, net: { ...base.net, scanned: true, checked: ['10.42.2.3'] } }, 'm3').state;
  expect(s.net.scanned).toBe(false); expect(s.net.checked).toEqual([]);
});
test('nakładka: trafienie W., onProbe zastępuje domyślną linię', () => {
  const s = acceptOffer(afterKuba([atS1(60)]), 'w').state;
  const n = netNodes(s).find(x => x.ip === '10.42.7.12')!;
  expect(isTarget(s, n)).toBe(true);
  const restore = withMission('w', { onProbe: (st, node) => ({ state: st, lines: [{ html: `X ${node.ip}` }], ui: [] }) });
  try {
    const sc = scan(runLine(s, 'use S1').state, []).state;
    expect(txt(probe(sc, '10.42.7.12'))).toBe('X 10.42.7.12');
  } finally { restore(); }
});
test('addNodes dokłada urządzenia w swojej podsieci', () => {
  const restore = withMission('m3', { network: { addNodes: [{ ip: '10.42.5.99', sh: '◉', net: '5', akt: Array(24).fill(2), kto: 'test' }] } });
  try {
    const s = acceptOffer(afterKuba([atS1(60)]), 'm3').state;
    const ips = netNodes(s).map(x => x.ip);
    expect(ips).toHaveLength(22);
    expect(ips.indexOf('10.42.5.99')).toBe(ips.indexOf('10.42.5.17') + 1);
  } finally { restore(); }
});
test('paczka czeka do udanego wyjazdu; devices ją pokazuje', () => {
  const restore = withMission('w', { trip: SAMPLE_TRIP });
  try {
    const s = acceptOffer(afterKuba(), 'w').state;
    expect(packageWaiting(s)).toBe(true);
    expect(txt(runLine(s, 'devices'))).toContain('<span class="y">paczka od W.</span>   zapas 60 min');
    const after = { ...s, trip: { ...s.trip, mission: 'w' as const, last: 'ok' as const }, devices: [atS1(60)] };
    expect(packageWaiting(after)).toBe(false);
  } finally { restore(); }
});
test('następny dzień rozłącza z S1', () => {
  const s = runLine(acceptOffer(afterKuba([atS1(60)]), 'w').state, 'use S1').state;
  expect(nextDay(s).state.terminal.location).toEqual({ kind: 'home' });
});
test('martwy podsłuch przy S1 (zapas 0): paczka nadal czeka i devices ją pokazuje', () => {
  const restore = withMission('w', { trip: SAMPLE_TRIP });
  try {
    const s = acceptOffer(afterKuba([atS1(0)]), 'w').state;
    expect(packageWaiting(s)).toBe(true);
    expect(txt(runLine(s, 'devices'))).toContain('<span class="y">paczka od W.</span>   zapas 60 min');
  } finally { restore(); }
});
