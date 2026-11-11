import { expect, test } from 'vitest';
import { scan, probe, route, parseFilter, netNodes, toggleCross, clearFilter, initNetState } from '../../src/engine/network';
import { afterKuba, atS1, linked } from './netHelpers';
const txt = (r: any) => r.lines.map((l: any) => l.html).join('\n');
const ready = () => linked(afterKuba([atS1(60)]));
const scanned = () => scan(ready(), []).state;

test('scan bez połączenia', () => {
  const s = afterKuba([atS1(60)]); const r = scan(s, []);
  expect(txt(r)).toContain('Brak połączenia.'); expect(r.state.t).toBe(s.t);
});
test('pierwszy scan: 3/2, wynik, NetMap, licznik', () => {
  const s = ready(); const r = scan(s, []);
  expect(r.state.t).toBe(s.t + 3); expect(r.state.devices[0].minutes).toBe(58);
  expect(r.state.net.scanned).toBe(true); expect(r.state.stats.scans).toBe(s.stats.scans + 1);
  expect(txt(r)).toContain('Urządzeń: 21');
  expect(txt(r)).toContain('10.42.7.12    ◆ serwer    .7.x     8–18');
  expect(r.ui).toContainEqual({ kind: 'open', app: 'netmap' });
});
test('filtry: za darmo, Linux +0,2 raz, licznik rośnie', () => {
  const s = scanned();
  const a = scan(s, ['--net', '10.42.7', '--type', 'serwer', '--off', '18-24']);
  expect(a.state.t).toBe(s.t); expect(a.state.devices).toEqual(s.devices);
  expect(txt(a)).toContain('Filtr: scan --net 10.42.7 --type serwer --off 18-24</span> · Urządzeń: 2 z 21');
  expect(a.state.gains).toContainEqual({ sk: 'Linux', v: 0.2, why: 'filtry polecenia scan' });
  expect(a.state.stats.scans).toBe(s.stats.scans + 1);
  expect(txt(scan(s, ['--type', 'serwer']))).toContain('Urządzeń: 6 z 21');
  expect(txt(scan(s, ['--off', '18-24']))).toContain('Urządzeń: 7 z 21');
  expect(scan(a.state, []).state.net.filter).toBeNull();
});
test('błędy filtrów', () => {
  expect(parseFilter(['--net', '10.42'])).toEqual({ ok: false, err: 'Użycie: --net 10.42.7' });
  expect(parseFilter(['--type', 'Serwer'])).toEqual({ ok: false, err: 'Typy: serwer, komputer, router, drukarka, kamera' });
  expect(parseFilter(['--off', '24-18'])).toEqual({ ok: false, err: 'Użycie: --off 18-24 (godziny)' });
  expect(parseFilter(['--x<'])).toEqual({ ok: false, err: 'Nieznana opcja --x&lt;. Opcje: --net, --type, --off' });
  expect(txt(scan(ready(), ['--net', '10.42.7']))).toContain('Filtry działają na wyniku skanu.');
});
test('kolejność opcji bez znaczenia', () => {
  const s = scanned();
  const a = scan(s, ['--net', '10.42.7', '--type', 'serwer']);
  const b = scan(s, ['--type', 'serwer', '--net', '10.42.7']);
  expect(a.state.net.filter).toMatchObject({ net: '7', type: 'serwer' });
  expect(txt(a).match(/Urządzeń: \d+ z 21/)![0]).toBe(txt(b).match(/Urządzeń: \d+ z 21/)![0]);
});
test('probe: 6/3, sprawdzony, powtórka bez kosztu', () => {
  const s = scanned(); const r = probe(s, '10.42.9.2');
  expect(r.state.t).toBe(s.t + 6); expect(r.state.devices[0].minutes).toBe(55);
  expect(r.state.net.checked).toEqual(['10.42.9.2']);
  const again = probe(r.state, '10.42.9.2');
  expect(again.state.t).toBe(r.state.t); expect(txt(again)).toContain('10.42.9.2 już sprawdzony: serwer projektów, Data-Tech.');
});
test('probe: bez skanu, nieznany, bez połączenia', () => {
  expect(txt(probe(ready(), '10.42.9.2'))).toContain('Nie znasz jeszcze tej sieci.');
  expect(txt(probe(scanned(), '<b>'))).toContain('Nie ma urządzenia &lt;b&gt; w wyniku skanu.');
  const off = { ...scanned(), terminal: { ...scanned().terminal, location: { kind: 'home' as const } } };
  expect(probe(off, '10.42.9.2').state.t).toBe(off.t);
  expect(txt(probe(off, '10.42.9.2'))).toContain('Brak połączenia.');
});
test('probe przy zapasie 2 min: wynik i zerwanie', () => {
  const s0 = scanned(); const s = { ...s0, devices: [{ ...s0.devices[0], minutes: 2 }] };
  const r = probe(s, '10.42.9.2');
  expect(r.state.net.checked).toContain('10.42.9.2');
  expect(r.state.devices[0].minutes).toBe(0);
  expect(r.state.terminal.location).toEqual({ kind: 'home' });
  const t = txt(r);
  expect(t.indexOf('10.42.9.2 to')).toBeLessThan(t.indexOf('PODSŁUCH-1 wyczerpany'));
});
test('route bank: 2 min gry, 0 urządzenia, bez połączenia', () => {
  const s = afterKuba([atS1(60)]); const r = route(s, ['bank']);
  expect(r.state.t).toBe(s.t + 2); expect(r.state.devices[0].minutes).toBe(60); expect(r.state.net.routed).toBe(true);
  expect(txt(r)).toContain('<span class="c">10.42.7.1</span>');
  expect(txt(route(s, []))).toBe('Użycie: route bank');
});
test('skreślanie i czyszczenie filtra bez kosztu', () => {
  const s = toggleCross(scanned(), '10.42.2.3'); expect(s.net.crossed).toEqual(['10.42.2.3']);
  expect(toggleCross(s, '10.42.2.3').net.crossed).toEqual([]);
  expect(clearFilter(scan(s, ['--type', 'kamera']).state).net.filter).toBeNull();
});
test('initNetState i netNodes bez nakładki', () => {
  expect(initNetState()).toEqual({ scanned: false, filter: null, checked: [], crossed: [], routed: false, reusedBug: false, reuseAnnounced: false, s1Ms: 0 });
  expect(netNodes(afterKuba())).toHaveLength(21);
});
test('scan przy zapasie 2 min: wynik, potem zerwanie', () => {
  const s = linked(afterKuba([atS1(2)])); const r = scan(s, []);
  const t = txt(r);
  expect(r.state.devices[0].minutes).toBe(0);
  expect(r.state.terminal.location).toEqual({ kind: 'home' });
  expect(r.state.net.scanned).toBe(true);
  expect(t.indexOf('Urządzeń: 21')).toBeLessThan(t.indexOf('PODSŁUCH-1 wyczerpany'));
});
