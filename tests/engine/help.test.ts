import { afterEach, expect, test } from 'vitest';
import type { HelpGroup } from '../../src/engine/help';
import { BASE_HELP, PROGS, helpBadge, helpGroups, helpInsert, markHelpSeen, progsFor, typeInTerminal } from '../../src/engine/help';
import { game, withMission } from './fixtures';

let restore: (() => void) | undefined;
afterEach(() => { restore?.(); restore = undefined; });

const KUBA_HELP: HelpGroup[] = [
  { title: 'Podstawowe', unlocked: () => true, entries: [{ cmd: 'help', desc: 'lista poleceń w Terminalu', cost: '' }] },
  { title: 'Włamanie', need: 'po zakupie Wytrycha w Darknecie', unlocked: s => s.owned.includes('wyt'),
    entries: [{ cmd: 'crack &lt;ip&gt;', desc: 'otwiera Wytrych: łamie hasło serwera', cost: '1 min gry · w misji 1 bez namierzania' }] }];
const thu = () => game({ day: 'czw', done: ['kuba'], mail: { ...game().mail, hidden: [] } });

test('bez misji w centrum uwagi: wspólne grupy', () => {
  expect(helpGroups(thu()).map(g => [g.group.title, g.unlocked, g.isNew, g.key])).toEqual([
    ['Podstawowe', true, false, 'base:Podstawowe'], ['Urządzenia w terenie', true, false, 'base:Urządzenia w terenie']]);
  expect(BASE_HELP[1].entries[1]).toEqual({ cmd: 'use S1', desc: 'łączy z urządzeniem przy skrzynce S1', cost: '2 min gry · 1 min urządzenia' });
});
test('misja z własną Ściągą zastępuje wspólną; grupa zablokowana, potem „nowe” i „!”', () => {
  restore = withMission('kuba', { help: KUBA_HELP, helpReplacesBase: true });
  const s = game();
  expect(helpGroups(s).map(g => [g.group.title, g.unlocked, g.isNew])).toEqual([['Podstawowe', true, false], ['Włamanie', false, false]]);
  expect(helpBadge(s)).toBe(false);
  const bought = game({ owned: ['cpu1', 'net2', 'wyt'] });
  expect(helpGroups(bought)[1]).toMatchObject({ unlocked: true, isNew: true, key: 'kuba:Włamanie' });
  expect(helpBadge(bought)).toBe(true);
  const seen = markHelpSeen(bought);
  expect(seen.helpSeen).toEqual(['kuba:Włamanie']);
  expect(helpBadge(seen)).toBe(false);
  expect(markHelpSeen(seen)).toBe(seen);
  expect(helpGroups(seen)[1].isNew).toBe(true);
});
test('misja bez helpReplacesBase dokłada grupy po wspólnych', () => {
  restore = withMission('m3', { help: [{ title: 'Kamery (zlecenie L.)', need: 'w zleceniu L.', unlocked: s => s.active === 'm3', entries: [] }] });
  const s = { ...thu(), active: 'm3' as const };
  expect(helpGroups(s).map(g => g.group.title)).toEqual(['Podstawowe', 'Urządzenia w terenie', 'Kamery (zlecenie L.)']);
});
test('helpInsert usuwa miejsca na argumenty', () => {
  expect(helpInsert({ cmd: 'connect &lt;ip&gt;', desc: '', cost: '' })).toBe('connect ');
  expect(helpInsert({ cmd: 'info &lt;plik&gt;', desc: '', cost: '' })).toBe('info ');
  expect(helpInsert({ cmd: 'use S1', desc: '', cost: '' })).toBe('use S1');
  expect(helpInsert({ cmd: 'x &lt;a&gt;', desc: '', cost: '', insert: 'x 1' })).toBe('x 1');
});
test('progsFor: NetMap ukryty u Kuby, Wytrych po zakupie', () => {
  restore = withMission('kuba', { hidePrograms: ['NetMap'] });
  expect(progsFor(game()).map(p => p[0])).toEqual(['Terminal', 'Notatki', 'Poczta', 'Przeglądarka', 'Darknet', 'Ściąga']);
  expect(progsFor(game({ owned: ['cpu1', 'net2', 'wyt'] })).at(-1)![0]).toBe('Wytrych');
  expect(progsFor(thu()).map(p => p[0])).toContain('NetMap');
  expect(PROGS[0]).toEqual(['Terminal', 'tu wykonujesz wszystkie akcje: łączysz się, skanujesz, sprawdzasz, włamujesz się']);
});
test('typeInTerminal tylko emituje zdarzenie', () => {
  const s = game(); const r = typeInTerminal(s, 'connect ');
  expect(r.state).toBe(s); expect(r.ui).toEqual([{ kind: 'typeInTerminal', cmd: 'connect ' }]);
});
