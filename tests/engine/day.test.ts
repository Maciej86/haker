import { test, expect } from 'vitest';
import { deadlineLabel, nextDay } from '../../src/engine/clock';
import { visibleOffers } from '../../src/engine/missions';
import { game } from './fixtures';

test('termin: zostało, czerwień poniżej 30 min, po terminie', () => {
  const w = (t: number) => game({ day: 'czw', active: 'w', t });
  expect(deadlineLabel(w(14 * 60 + 5))).toEqual({ text: 'czw 19:00 · zostało 4 h 55 min', red: false });
  expect(deadlineLabel(w(18 * 60 + 30))).toEqual({ text: 'czw 19:00 · zostało 30 min', red: false });
  expect(deadlineLabel(w(18 * 60 + 31))).toEqual({ text: 'czw 19:00 · zostało 29 min', red: true });
  expect(deadlineLabel(w(19 * 60))).toEqual({ text: 'czw 19:00 · po terminie', red: true });
  expect(deadlineLabel(game({ active: 'kuba' }))).toBeNull();
  expect(deadlineLabel(game({ active: 'm3' }))).toBeNull();
  expect(deadlineLabel(game())).toBeNull();
});
test('nextDay po misji Kuby: czwartek 13:50, dwie oferty, punkt kontrolny', () => {
  const before = game({ t: 20 * 60 + 54, done: ['kuba'], overlay: 'summary', summary: [], gains: [{ sk: 'Linux', v: 0.2, why: 'x' }],
    terminal: { lines: [{ html: 'stare' }], history: ['ls'], location: { kind: 'host', ip: '83.21.40.17', path: '~', via: 'direct' } } });
  const r = nextDay(before);
  expect(r.state).toMatchObject({ day: 'czw', t: 830, sec: 0, gains: [], overlay: null, summary: null, summaryMeta: null, failed: false });
  expect(r.state.terminal.history).toEqual(['ls']);
  expect(r.state.terminal.location).toEqual({ kind: 'home' });
  expect(r.state.terminal.lines.map(l => l.html)).toEqual(['<span class="c">NeonOS 0.4</span>',
    '<span class="d">czw 13:50 · nowy dzień. W Poczcie czekają dwie oferty. Przyjąć można jedną naraz.</span>', '']);
  expect(r.state.mail.hidden).toEqual([]);
  expect(visibleOffers(r.state)).toEqual(['w', 'm3', 'kuba']);
  expect(r.state.dayCheckpoint).toMatchObject({ day: 'czw', t: 830 });
  expect(r.state.dayCheckpoint).not.toHaveProperty('dayCheckpoint');
  expect(r.ui).toEqual([{ kind: 'toast', text: '2 nowe oferty w Poczcie' }, { kind: 'open', app: 'terminal' }, { kind: 'open', app: 'mail' }]);
  expect(before.day).toBe('śr');                                  // bez mutacji
});
test('nextDay z jedną ofertą i zawinięciem tygodnia', () => {
  const r = nextDay(game({ day: 'nd', done: ['kuba', 'w'], mail: { ...game().mail, hidden: [] } }));
  expect(r.state.day).toBe('pon');
  expect(r.state.terminal.lines[1].html).toContain('nowy dzień. W Poczcie czeka oferta, która została z wczoraj.');
  expect(r.ui[0]).toEqual({ kind: 'toast', text: 'Oferta z wczoraj czeka w Poczcie' });
});
