import { expect, test } from 'vitest';
import type { Device, GameState, Location } from '../../src/engine/types';
import { runLine } from '../../src/engine/terminal';
import { game } from './fixtures';

const thu = (p: Partial<GameState> = {}) =>
  game({ day: 'czw', t: 16 * 60 + 5, done: ['kuba'], mail: { ...game().mail, hidden: [] }, ...p });
const at = (location: Location, devices: Device[] = []) => thu({ devices, terminal: { lines: [], history: [], location } });
const out = (s: GameState, line: string) => runLine(s, line).lines.map(l => l.html);

test.each(['help', 'whoami', 'clear', 'notes', 'status', 'devices', 'abort'])('%s nic nie kosztuje', c => {
  const s = thu(); const r = runLine(s, c);
  expect(r.state.t).toBe(s.t); expect(r.state.money).toBe(s.money);
});
test('help: pełna lista wspólna', () => {
  const [h] = out(thu(), 'help');
  expect(h.startsWith('<span class="c">Dostępne polecenia</span>\n  devices           twoje urządzenia w terenie')).toBe(true);
  expect(h).toContain('  use &lt;skrzynka&gt;    połącz z urządzeniem przy skrzynce, np. use S1');
  expect(h.endsWith('<span class="d">Pełny spis z opisami: Ściąga na pulpicie.</span>')).toBe(true);
});
test('clear czyści Terminal razem z echem', () => {
  const r = runLine(thu(), 'clear');
  expect(r.state.terminal.lines).toEqual([]); expect(r.lines).toEqual([]);
  expect(r.state.terminal.history).toEqual(['clear']);
});
test('notes otwiera Notatki', () => {
  const r = runLine(thu(), 'notes');
  expect(r.lines).toEqual([{ html: '<span class="d">Otwarto Notatki.</span>' }]);
  expect(r.ui).toEqual([{ kind: 'open', app: 'notes' }]);
});
test('abort bez czynności', () => {
  expect(out(thu(), 'abort')).toEqual(['<span class="d">Nic nie trwa.</span>']);
});
test('status: bez połączenia, przy S1 i na serwerze przez S1', () => {
  const bug: Device = { id: 'bug1', where: 'S1', minutes: 47 };
  expect(out(at({ kind: 'home' }, [bug]), 'status')).toEqual(['<span class="d">Brak połączenia.</span>']);
  const online = '<span class="c">PODSŁUCH-1 online</span> · łącze S1 (Net-Operator) · zapas pracy 47 min · <span class="d">widoczny w sieci banku jako 10.42.0.250</span>';
  expect(out(at({ kind: 'S1' }, [bug]), 'status')).toEqual([online]);
  expect(out(at({ kind: 'host', ip: '10.42.7.12', path: '/', via: 'S1' }, [bug]), 'status')).toEqual([online]);
  expect(out(at({ kind: 'S1' }, []), 'status')[0]).toContain('zapas pracy 0 min');
});
test('devices: brak, czeka, online, wyczerpany, w plecaku', () => {
  expect(out(at({ kind: 'home' }), 'devices')).toEqual(['<span class="d">Nie masz jeszcze urządzeń w terenie.</span>']);
  const head = '<span class="d">Urządzenie   Miejsce                       Stan              Zapas</span>\n';
  const row = (st: string, m: number) => `PODSŁUCH-1   skrzynka S1 · Poznań-Centrum  ${st}${m} min   <span class="d">adres w sieci banku: 10.42.0.250</span>`;
  expect(out(at({ kind: 'home' }, [{ id: 'bug1', where: 'S1', minutes: 60 }]), 'devices'))
    .toEqual([head + row('<span class="y">czeka</span>            ', 60)]);
  expect(out(at({ kind: 'S1' }, [{ id: 'bug1', where: 'S1', minutes: 41 }]), 'devices'))
    .toEqual([head + row('<span class="c">online</span>           ', 41)]);
  expect(out(at({ kind: 'S1' }, [{ id: 'bug1', where: 'S1', minutes: 0 }]), 'devices'))
    .toEqual([head + row('<span class="r">wyczerpany</span>       ', 0)]);
  expect(out(at({ kind: 'home' }, [{ id: 'bug1', where: 'plecak', minutes: 60 }]), 'devices')).toEqual([head +
    'PODSŁUCH-1   <span class="y">w plecaku (nowy)</span>                       60 min   <span class="d">trzeba podpiąć przy S1</span>']);
});
