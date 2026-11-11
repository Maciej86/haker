import { expect, test } from 'vitest';
import { replyBox, canDeliver, deliver, type DeliveryDef, type ReplyBox } from '../../src/engine/delivery';
import { step } from '../../src/engine/types';
import { MISSIONS } from '../../src/missions';
import { game } from './fixtures';

// Raport tekstowy w kształcie planu 32 (L.), podpięty na czas testu pod szkielet m3.
const BOX: ReplyBox = { title: 'Odpowiedz L.', text: 'Raport: ', button: 'Wyślij raport', cost: 2, attach: false };
const REPORT: DeliveryDef = {
  kind: 'report', title: 'Odpowiedz L.',
  box: s => (s.active === 'm3' ? BOX : null),
  send: (s, text, fileId) => step({ ...s, t: s.t + 2, mail: { ...s.mail, threads: { ...s.mail.threads,
    m3: [...(s.mail.threads.m3 ?? []), { from: 'Ty', when: 'x', html: `${text}|${fileId}` }] } } }),
};
function withDelivery<T>(d: DeliveryDef, fn: () => T): T {
  const orig = MISSIONS.m3.delivery; MISSIONS.m3.delivery = d;
  try { return fn(); } finally { MISSIONS.m3.delivery = orig; }
}

test('szkielet bez box/send: brak pola oddania, deliver nic nie robi', () => withDelivery({ kind: 'report' }, () => {
  const s = game({ active: 'm3' });
  expect(MISSIONS.m3.delivery).toEqual({ kind: 'report' });
  expect(replyBox(s, 'm3')).toBeNull();
  expect(canDeliver(s, 'm3')).toBe(false);
  expect(deliver(s, 'm3', 'x').state).toBe(s);
}));
test('raport bez pliku: pole, canDeliver, send dostaje fileId null', () => withDelivery(REPORT, () => {
  const s = game({ active: 'm3' });
  expect(replyBox(s, 'm3')).toEqual(BOX);
  expect(canDeliver(s, 'm3')).toBe(true);
  const r = deliver(s, 'm3', 'wszedł i wyszedł', 'podany:przypadkiem');
  expect(r.state.t).toBe(s.t + 2);
  expect(r.state.mail.threads.m3.at(-1)!.html).toBe('wszedł i wyszedł|null');
}));
test('poza swoją chwilą: przed przyjęciem, cudza misja, po porażce', () => withDelivery(REPORT, () => {
  for (const s of [game(), game({ active: 'kuba' }), game({ active: 'm3', failed: true })]) {
    expect(canDeliver(s, 'm3')).toBe(false);
    expect(deliver(s, 'm3', 'x').state).toBe(s);
  }
}));
test('attach: bez pliku nic, z plikiem send dostaje fileId', () =>
  withDelivery({ ...REPORT, kind: 'file', box: () => ({ ...BOX, attach: true, emptyAttach: 'pusto' }) }, () => {
    const s = game({ active: 'm3' });
    expect(deliver(s, 'm3', 'x').state).toBe(s);
    expect(deliver(s, 'm3', 'x', null).state).toBe(s);
    expect(deliver(s, 'm3', 'x', '1.2.3.4:a.txt').state.mail.threads.m3.at(-1)!.html).toBe('x|1.2.3.4:a.txt');
  }));
