import { expect, test } from 'vitest';
import { runLine, promptFor } from '../../src/engine/terminal';
import { afterKuba, atS1, inPack } from './netHelpers';
import { kubaAccepted } from '../missions/kuba/helpers';
const txt = (r: any) => r.lines.map((l: any) => l.html).join('\n');

test('use S1: 2/1, znak zachęty, toast', () => {
  const s = afterKuba([atS1(60)]); const r = runLine(s, 'use s1');
  expect(r.state.terminal.location).toEqual({ kind: 'S1' });
  expect(promptFor(r.state)).toBe('S1 >');
  expect(r.state.t).toBe(s.t + 2); expect(r.state.devices[0].minutes).toBe(59);
  expect(txt(r)).toContain('Zapas pracy: 59 min · połączenie kosztowało 2 min gry i 1 min urządzenia.');
  expect(r.ui).toContainEqual({ kind: 'toast', text: 'PODSŁUCH-1 online · krok „Połączenie z podsłuchem” zaliczony' });
  expect(txt(runLine(r.state, 'use S1'))).toContain('Już połączono z PODSŁUCH-1.');
});
test('use: błędy', () => {
  expect(txt(runLine(afterKuba([atS1(60)]), 'use'))).toContain('Użycie: use &lt;skrzynka&gt;, np. use S1');
  expect(txt(runLine(afterKuba([atS1(60)]), 'use s2<'))).toContain('Przy skrzynce S2&lt; nie masz urządzenia.');
  expect(txt(runLine(afterKuba([atS1(0)]), 'use S1'))).toContain('PODSŁUCH-1 nie odpowiada: wyczerpany zapas pracy.');
  expect(txt(runLine(afterKuba([inPack()]), 'use S1'))).toContain('PODSŁUCH-1 jest w plecaku.');
  expect(txt(runLine(afterKuba(), 'use S1'))).toContain('PODSŁUCH-1 jest jeszcze w paczce na przystanku w Poznaniu.');
});
test('use przy zapasie 1 min: online, potem wyczerpanie, nic poniżej 0', () => {
  const r = runLine(afterKuba([atS1(1)]), 'use S1');
  expect(r.state.devices[0].minutes).toBe(0);
  expect(r.state.terminal.location).toEqual({ kind: 'home' });
  const t = txt(r);
  expect(t.indexOf('PODSŁUCH-1 online')).toBeLessThan(t.indexOf('PODSŁUCH-1 wyczerpany'));
});
test('use: podsłuch z poprzedniej misji, jednorazowa linia', () => {
  const s0 = afterKuba([atS1(60)]);
  const s = { ...s0, active: 'w' as const, net: { ...s0.net, reusedBug: true } };
  const r = runLine(s, 'use S1');
  expect(txt(r)).toContain('PODSŁUCH-1 z poprzedniej misji wciąż wisi w szafce przy S1.');
  expect(r.state.net.reuseAnnounced).toBe(true);
  const again = runLine(runLine(r.state, 'disconnect').state, 'use S1');
  expect(txt(again)).not.toContain('z poprzedniej misji');
});
test('disconnect o jeden poziom: S1 → komputer', () => {
  const s = runLine(afterKuba([atS1(60)]), 'use S1').state; const r = runLine(s, 'disconnect');
  expect(r.state.terminal.location).toEqual({ kind: 'home' });
  expect(txt(r)).toContain('Urządzenie zostaje w szafce przy S1, zapas 59 min nie maleje.');
  expect(r.state.t).toBe(s.t);
});
test('serwer przez S1 → S1', () => {
  const s0 = afterKuba([atS1(60)]);
  const s = { ...s0, terminal: { ...s0.terminal, location: { kind: 'host' as const, ip: '10.42.7.12', path: '/', via: 'S1' as const } } };
  expect(runLine(s, 'disconnect').state.terminal.location).toEqual({ kind: 'S1' });
});
test('status z planu 02 widzi połączenie z use S1', () => {
  const s = runLine(afterKuba([atS1(60)]), 'use S1').state;
  expect(txt(runLine(s, 'status'))).toContain('<span class="c">PODSŁUCH-1 online</span> · łącze S1 (Net-Operator) · zapas pracy 59 min');
});
test('polecenia rozpoznania przez Terminal', () => {
  const s = runLine(afterKuba([atS1(60)]), 'use S1').state;
  const a = runLine(s, 'scan'); expect(a.state.net.scanned).toBe(true);
  expect(runLine(a.state, 'probe 10.42.2.8').state.net.checked).toEqual(['10.42.2.8']);
  expect(runLine(a.state, 'route bank').state.net.routed).toBe(true);
});
test('probe na adres z HTML-em i bez połączenia: bez kosztu, z esc', () => {
  const s = runLine(afterKuba([atS1(60)]), 'use S1').state;
  const a = runLine(s, 'scan').state;
  const r = runLine(a, 'probe <i>');
  expect(txt(r)).toContain('Nie ma urządzenia &lt;i&gt; w wyniku skanu.');
  expect(r.state.t).toBe(a.t);
  expect(runLine(a, 'probe').lines.length).toBeGreaterThan(0);
});
test('u Kuby nadal „Tego teraz nie potrzebujesz”', () => {
  expect(txt(runLine(kubaAccepted(), 'scan'))).toContain('Tego teraz nie potrzebujesz.');
  expect(txt(runLine(kubaAccepted(), 'devices'))).toContain('Nie masz jeszcze urządzeń w terenie.');
});
