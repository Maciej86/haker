import { expect, test } from 'vitest';
import { deliver, fileDelivery } from '../../src/engine/delivery';
import { MISSIONS } from '../../src/missions';
import { kubaAccepted, withKuba, run } from '../missions/kuba/helpers';

const Z = (n: string) => `83.21.40.17:${n}`;
const withFiles = (...names: string[]) =>
  run(withKuba({ ...kubaAccepted(), owned: ['cpu1', 'net2', 'wyt'] }, { conn: true, cracked: true }),
    'connect 83.21.40.17', ...names.map(n => `get ${n}`), 'disconnect').state;

test('Kuba bez late: dobry plik o 23:00 kończy misję jak przedtem', () => {
  const r = deliver({ ...withFiles('playlista.txt'), t: 23 * 60 }, 'kuba', 'Proszę bardzo.', Z('playlista.txt'));
  expect(r.state.done).toContain('kuba');
  expect(r.state.failed).toBe(false);
  expect(r.state.mail.threads.kuba.at(-1)!.html).toContain('Jest! Sobota uratowana.');
});

test('late zwraca tekst: odpowiedź bad po 3 min zamiast oceny pliku, porażka', () => {
  const orig = MISSIONS.kuba.delivery;
  MISSIONS.kuba.delivery = fileDelivery('kuba', {
    title: 'Odpowiedz Kubie', text: 'Proszę bardzo.', emptyAttach: '', cost: 1, judge: () => ({ ok: true, reply: 'ok' }),
    late: (s) => (s.t > 22 * 60 ? 'Za późno.' : null),
  });
  try {
    const s = { ...withFiles('playlista.txt'), t: 23 * 60 };
    const r = deliver(s, 'kuba', 'x', Z('playlista.txt'));
    expect(r.state.mail.threads.kuba.slice(-2)).toEqual([
      { from: 'Ty', when: 'śr 23:01', html: 'x', attachment: 'playlista.txt' },
      { from: 'Kuba', when: 'śr 23:04', html: 'Za późno.', bad: true },
    ]);
    expect(r.state).toMatchObject({ t: 23 * 60 + 1, failed: true, overlay: 'summary', active: 'kuba' });
    expect(r.state.done).not.toContain('kuba');
  } finally { MISSIONS.kuba.delivery = orig; }
});
