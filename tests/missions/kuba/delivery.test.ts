import { expect, test } from 'vitest';
import { replyBox, canDeliver, deliver, deliveryFiles } from '../../../src/engine/delivery';
import { missionDef } from '../../../src/engine/missions';
import { game } from '../../engine/fixtures';
import { kubaAccepted, withKuba, run } from './helpers';

const Z = (n: string) => `83.21.40.17:${n}`;
const withFiles = (...names: string[]) =>
  run(withKuba({ ...kubaAccepted(), owned: ['cpu1', 'net2', 'wyt'] }, { conn: true, cracked: true }),
    'connect 83.21.40.17', ...names.map(n => `get ${n}`), 'disconnect').state;

test('DeliveryDef Kuby i pole odpowiedzi po przyjęciu', () => {
  expect(missionDef('kuba').delivery).toMatchObject({ kind: 'file', title: 'Odpowiedz Kubie' });
  expect(replyBox(game(), 'kuba')).toBeNull();
  expect(canDeliver(game(), 'kuba')).toBe(false);
  expect(replyBox(withFiles(), 'kuba')).toEqual({ title: 'Odpowiedz Kubie', text: 'Proszę bardzo.', button: 'Wyślij', cost: 1, attach: true, emptyAttach: 'pusto: pobierz plik z serwera Zenka (get)' });
  expect(canDeliver(withFiles(), 'kuba')).toBe(true);
});
test('zły plik: 1 min, żart, toast, misja trwa', () => {
  const s = withFiles('przepis_na_paczki.txt');
  const r = deliver(s, 'kuba', 'Proszę <b>bardzo', Z('przepis_na_paczki.txt'));
  expect(r.state.t).toBe(s.t + 1);
  const th = r.state.mail.threads.kuba;
  expect(th.at(-2)).toMatchObject({ from: 'Ty', html: 'Proszę &lt;b&gt;bardzo', attachment: 'przepis_na_paczki.txt' });
  expect(th.at(-1)).toMatchObject({ from: 'Kuba', bad: true, html: 'Pączki? Brzmi smacznie, ale chodziło o playlistę :)' });
  expect(r.ui).toContainEqual({ kind: 'toast', text: 'Kuba: Pączki? Brzmi smacznie, ale chodziło o playlistę :)', bad: true });
  expect(r.state.done).not.toContain('kuba');
  expect(canDeliver(r.state, 'kuba')).toBe(true);
});
test('dwa złe pliki, potem dobry', () => {
  let s = withFiles('zamowienia_sobota.txt', 'podpowiedz_hasla.txt', 'playlista.txt'); const t0 = s.t;
  s = deliver(s, 'kuba', 'x', Z('zamowienia_sobota.txt')).state;
  expect(s.mail.threads.kuba.at(-1)!.html).toBe('Hah, widzę swoje 20 pączków. Ale potrzebuję playlisty!');
  s = deliver(s, 'kuba', 'x', Z('podpowiedz_hasla.txt')).state;
  expect(s.mail.threads.kuba.at(-1)!.html).toBe('Zenek i jego zagadki… Wyślij mi playlistę.');
  const r = deliver(s, 'kuba', 'Proszę bardzo.', Z('playlista.txt'));
  expect(r.state.t).toBe(t0 + 3);
  expect(r.state.done).toContain('kuba');
  expect(r.state.mail.threads.kuba.at(-1)!.html).toContain('Jest! Sobota uratowana.');
  expect(canDeliver(r.state, 'kuba')).toBe(false);
  expect(deliver(r.state, 'kuba', 'x', Z('playlista.txt')).state).toBe(r.state);
});
test('plik spoza Pobranych albo bez pliku: bez zmian', () => {
  const s = withFiles('playlista.txt');
  expect(deliveryFiles(s, 'kuba').map(f => f.fileId)).toEqual([Z('playlista.txt')]);
  expect(deliver(s, 'kuba', 'x', Z('nie_ma.txt')).state).toBe(s);
  expect(deliver(s, 'kuba', 'x').state).toBe(s);
});
