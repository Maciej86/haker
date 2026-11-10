import { afterEach, expect, test } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { GameState } from '../../src/engine/types';
import { HelpView } from '../../src/apps/help/HelpView';
import { game, withMission } from './fixtures';

let restore: (() => void) | undefined;
afterEach(() => { restore?.(); restore = undefined; });

const html = (s: GameState) => renderToStaticMarkup(createElement(HelpView, { state: s, onType: () => {}, onSeen: () => {} }));

test('wspólna Ściąga: wstęp, grupy, przyciski Wpisz, programy', () => {
  const h = html(game({ day: 'czw', done: ['kuba'], mail: { ...game().mail, hidden: [] } }));
  expect(h).toContain('Polecenia wpisujesz w Terminalu. „Wpisz” wstawia przykład do Terminala, zatwierdzasz Enterem.');
  expect(h).toContain('<h4>Urządzenia w terenie</h4>');
  expect(h).toContain('<code>use S1</code>');
  expect(h).toContain('<small>2 min gry · 1 min urządzenia</small>');
  expect((h.match(/>Wpisz</g) ?? []).length).toBe(7);
  expect(h).toContain('<h4>Programy na pulpicie</h4>');
  expect(h).toContain('<b>NetMap</b>');
});
test('zablokowana grupa wyszarzona z warunkiem, potem „nowe”', () => {
  restore = withMission('kuba', { helpReplacesBase: true, hidePrograms: ['NetMap'], help: [
    { title: 'Włamanie', need: 'po zakupie Wytrycha w Darknecie', unlocked: s => s.owned.includes('wyt'),
      entries: [{ cmd: 'crack &lt;ip&gt;', desc: 'otwiera Wytrych: łamie hasło serwera', cost: '1 min gry' }] },
    { title: 'Inne', need: undefined, unlocked: () => false, entries: [{ cmd: 'x', desc: 'y', cost: '' }] }] });
  const locked = html(game());
  expect(locked).toContain('<h4>Włamanie · po zakupie Wytrycha w Darknecie</h4>');
  expect(locked).toContain('<h4>Inne · Odblokujesz później</h4>');
  expect(locked).toContain('class="cmd lk"');
  expect(locked).toContain('<code>crack &lt;ip&gt;</code>');
  expect(locked).not.toContain('>Wpisz<');
  expect(locked).not.toContain('<b>NetMap</b>');
  const open = html(game({ owned: ['cpu1', 'net2', 'wyt'] }));
  expect(open).toContain('<h4>Włamanie</h4>');
  expect(open).toContain('<span class="new">nowe</span>');
  expect(open).toContain('<b>Wytrych</b>');
});
