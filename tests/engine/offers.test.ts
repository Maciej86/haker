import { test, expect } from 'vitest';
import { visibleOffers, focusMission, isBlocked, acceptOffer, BUSY_NOTE } from '../../src/engine/missions';
import { game, withMission } from './fixtures';

test('nowa gra: widać tylko Kubę', () => {
  expect(visibleOffers(game())).toEqual(['kuba']);
  expect(focusMission(game())).toBe('kuba');
});
test('W. i L. nie wyskakują tego samego dnia po misji Kuby', () => {
  expect(visibleOffers(game({ done: ['kuba'] }))).toEqual(['kuba']);
  expect(focusMission(game({ done: ['kuba'] }))).toBeNull();
});
test('po odkryciu ofert kolejność jak MAIL_ORDER, focus zależy od liczby wolnych', () => {
  const thu = game({ day: 'czw', done: ['kuba'], mail: { ...game().mail, hidden: [] } });
  expect(visibleOffers(thu)).toEqual(['w', 'm3', 'kuba']);
  expect(focusMission(thu)).toBeNull();
  expect(focusMission({ ...thu, done: ['kuba', 'w'] })).toBe('m3');
});
test('blokada drugiej oferty', () => {
  const s = game({ done: ['kuba'], active: 'w', mail: { ...game().mail, hidden: [] } });
  expect(isBlocked(s, 'm3')).toBe(true);
  expect(isBlocked(s, 'w')).toBe(false);
  expect(isBlocked(s, 'kuba')).toBe(false);
  expect(acceptOffer(s, 'm3').state).toBe(s);
  expect(BUSY_NOTE.body).toBe('Ta oferta poczeka. W demo nie da się prowadzić dwóch zleceń naraz.');
});
test('przyjęcie oferty Kuby: koszty 1 + 2 min, wątek, aktywna misja', () => {
  const r = acceptOffer(game({ gains: [{ sk: 'Linux', v: 0.1, why: 'stare' }] }), 'kuba');
  expect(r.state.t).toBe(20 * 60 + 33);
  expect(r.state.active).toBe('kuba');
  expect(r.state.gains).toEqual([]);
  expect(r.state.mail.read).toContain('kuba');
  const th = r.state.mail.threads.kuba;
  expect(th.map(m => [m.from, m.when])).toEqual([['Ty', 'śr 20:31'], ['Kuba', 'śr 20:33']]);
  expect(th[0].html).toBe('Jasne. Byłem u Zenka dwa dni temu i mam zapisane IP jego serwerka. Połączę się bezpośrednio.');
  expect(r.ui[0]).toMatchObject({ kind: 'mailArrives', thread: 'kuba', delayMs: 1200 });
});
test('przyjęcie używa szkicu gracza i go escapuje; drugie przyjęcie nic nie robi', () => {
  const s = game({ mail: { ...game().mail, draft: { kuba: 'ok <b>' } } });
  const r = acceptOffer(s, 'kuba');
  expect(r.state.mail.threads.kuba[0].html).toBe('ok &lt;b&gt;');
  expect(r.state.mail.draft.kuba).toBeUndefined();
  expect(acceptOffer(r.state, 'kuba').state).toBe(r.state);
});
test('onAccept: stan, linie i zdarzenia dołączone po mailArrives', () => {
  const restore = withMission('kuba', {
    onAccept: s => ({ state: { ...s, money: 1 }, lines: [{ html: 'x' }], ui: [{ kind: 'toast', text: 't' }] }),
  });
  try {
    const r = acceptOffer(game(), 'kuba');
    expect(r.state.money).toBe(1);
    expect(r.lines).toEqual([{ html: 'x' }]);
    expect(r.ui.map(u => u.kind)).toEqual(['mailArrives', 'toast']);
  } finally { restore(); }
});
test('acceptOffer nie mutuje wejścia', () => {
  const s = game({ mail: { ...game().mail, draft: { kuba: 'szkic' }, threads: { kuba: [{ from: 'Kuba', when: 'śr 20:12', html: 'x' }] } } });
  const before = structuredClone(s);
  acceptOffer(s, 'kuba');
  expect(s).toEqual(before);
});
