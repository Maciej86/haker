import { expect, test } from 'vitest';
import { nextDay } from '../../../src/engine/clock';
import { visibleOffers, focusMission } from '../../../src/engine/missions';
import { goMap } from '../../../src/engine/desktop';
import { mailThreads } from '../../../src/engine/mail';
import { deliver, canDeliver } from '../../../src/engine/delivery';
import { kubaAccepted, withKuba, run } from './helpers';

const finished = () => deliver(run(withKuba({ ...kubaAccepted(), owned: ['cpu1', 'net2', 'wyt'] }, { conn: true, cracked: true }),
  'connect 83.21.40.17', 'get playlista.txt', 'disconnect').state, 'kuba', 'Proszę bardzo.', '83.21.40.17:playlista.txt').state;

test('przed końcem misji oferty W. i L. ukryte', () => {
  expect(visibleOffers(kubaAccepted())).toEqual(['kuba']);
});
test('następny dzień: czw 13:50, oferty W. i L., checkpoint', () => {
  const r = nextDay(finished()); const s = r.state;
  expect([s.day, s.t]).toEqual(['czw', 13 * 60 + 50]);
  expect(visibleOffers(s).filter(id => !s.done.includes(id))).toEqual(['w', 'm3']);
  expect(mailThreads(s).map(t => t.id)).toEqual(['w', 'm3', 'kuba']);
  expect((['kuba', 'w', 'm3'] as const).map(id => canDeliver(s, id))).toEqual([false, false, false]);
  expect([s.gains, s.overlay, s.summary, s.summaryMeta]).toEqual([[], null, null, null]);
  expect(s.dayCheckpoint).not.toBeNull();
  expect(s.terminal.location).toEqual({ kind: 'home' });
  expect(s.terminal.lines.map(l => l.html)).toContain('<span class="d">czw 13:50 · nowy dzień. W Poczcie czekają dwie oferty. Przyjąć można jedną naraz.</span>');
  expect(r.ui).toEqual([{ kind: 'toast', text: '2 nowe oferty w Poczcie' }, { kind: 'open', app: 'terminal' }, { kind: 'open', app: 'mail' }]);
  expect(s.owned).toContain('wyt');
  expect(focusMission(s)).toBeNull();
  expect(goMap(s).state.screen).toBe('mapPoland');
});
