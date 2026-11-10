import { expect, it } from 'vitest';
import { mailThreads, unreadCount, defaultThread, markRead, threadStatus, sendAccept } from '../../src/engine/mail';
import { missionDef } from '../../src/engine/missions';
import { game } from './fixtures';
import { day2 } from '../helpers/states';

it('nowa gra: nieprzeczytany wątek Kuby', () => {
  const d = missionDef('kuba');
  expect(mailThreads(game())).toEqual([{ id: 'kuba', from: d.giver.name, subject: d.offer.subject, unread: true }]);
  expect(unreadCount(game())).toBe(1); expect(defaultThread(game())).toBe('kuba');
});
it('drugi dzień: W., L., Kuba; domyślnie pierwszy nieprzeczytany', () => {
  expect(mailThreads(day2()).map(t => t.id)).toEqual(['w', 'm3', 'kuba']); expect(defaultThread(day2())).toBe('w');
});
it('markRead bez duplikatów', () => {
  const once = markRead(game(), 'kuba'); expect(markRead(once, 'kuba')).toBe(once); expect(once.mail.read).toEqual(['kuba']);
});
it('statusy', () => {
  const s = { ...day2(), active: 'w' as const };
  expect([threadStatus(s, 'w'), threadStatus(s, 'm3'), threadStatus(s, 'kuba'), threadStatus(day2(), 'm3')]).toEqual(['accepted', 'blocked', 'done', 'open']);
});
it('sendAccept przyjmuje z tekstem z pola i escapuje go', () => {
  const r = sendAccept(game(), 'kuba', '<img src=x onerror=alert(1)>');
  expect(r.state.active).toBe('kuba');
  const mine = r.state.mail.threads.kuba.find(m => m.from === 'Ty')!;
  expect(mine.html).toContain('&lt;img'); expect(mine.html).not.toContain('<img');
});
it('sendAccept przy zablokowanej ofercie nic nie robi', () => {
  const s = { ...day2(), active: 'w' as const }; expect(sendAccept(s, 'm3', 'x').state).toBe(s);
});
