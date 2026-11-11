import { expect, test } from 'vitest';
import { runLine } from '../../../src/engine/terminal';
import { realtimeTick } from '../../../src/engine/realtime';
import { at, cracking, found, onBank, txt, withSrv } from './helpers';

const V2 = 'zestawienie_oddzialow_2026_v2.xlsx';

test('disconnect z S1 w trakcie Wytrycha: próba przerwana, dom, dalsze ticki nic nie zmieniają', () => {
  const r = runLine(withSrv(cracking(), { trace: 30 }), 'disconnect');
  expect(r.state.srv).toMatchObject({ crack: null, res: 'abort' });
  expect(r.state.terminal.location).toEqual({ kind: 'home' });
  expect(txt(r)).toContain('Przerwano włamanie.');
  expect(r.ui).toContainEqual({ kind: 'stopTimer', timer: 'crackTrace' });
  const later = realtimeTick(realtimeTick(r.state, 10_000).state, 10_000).state;
  expect(later.srv.crack).toBeNull();
  expect(later.srv.trace).toBe(0);
  expect([later.t, later.devices]).toEqual([r.state.t, r.state.devices]);
});
test('źródła czasu bez połączenia z S1 stoją (siatka bezpieczeństwa)', () => {
  const c = cracking();
  const unlinked = { ...c, terminal: { ...c.terminal, location: { kind: 'home' as const } } };
  expect(realtimeTick(unlinked, 10_000).state.srv.crack).toEqual(c.srv.crack);
});
test('disconnect z serwera w trakcie pobierania: przerwane, potem ticki nic nie pobierają', () => {
  const g = runLine(at(onBank(), '/finanse/zestawienia/2026'), `get ${V2}`).state;
  const d = runLine(g, 'disconnect');
  expect(txt(d).match(/Pobieranie przerwane\./g)).toHaveLength(1);
  expect(d.ui).toContainEqual({ kind: 'stopTimer', timer: 'download' });
  expect(d.state.srv.dl).toBeNull();
  const s = runLine(d.state, 'disconnect').state;
  expect(realtimeTick(s, 20_000).state.downloads).toEqual([]);
});
test('podsłuch pada na serwerze: mc i edytor zamknięte', () => {
  const s = withSrv({ ...onBank(), devices: [{ id: 'bug1', where: 'S1', minutes: 1 }] },
    { mc: { open: true, preview: '/it/README.txt' }, editor: { work: [], dirty: false, fromMc: true } });
  const r = runLine(s, 'ls');
  const dead = realtimeTick(r.state, 10_000).state;
  expect(dead.terminal.location).toEqual({ kind: 'home' });
  expect(dead.srv.mc).toEqual({ open: false, preview: null });
  expect(dead.srv.editor).toBeNull();
});
test('crack innego adresu przy S1: użycie z makiety; poza S1 bez zmian', () => {
  expect(txt(runLine(found(), 'crack 10.42.7.99'))).toContain('Użycie: crack 10.42.7.12');
  const home = runLine(found(), 'disconnect').state;
  expect(txt(runLine(home, 'crack 10.42.7.99'))).toContain('crack: brak odpowiedzi od 10.42.7.99.');
});
