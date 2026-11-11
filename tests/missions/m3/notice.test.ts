import '../../../src/missions';
import { expect, test } from 'vitest';
import { clockJump, clockView, stageIndex, termStep } from '../../../src/engine/missions';
import { realtimeTick, holdsOnLoad } from '../../../src/engine/realtime';
import { deserialize, serialize } from '../../../src/engine/state';
import { m3Check } from '../../../src/missions/m3/window';
import { m3Live } from '../../../src/missions/m3/live';
import { atBack, atT, back, lastMail, m3, okLeg1, run, txt, withM3 } from './helpers';

test('przed 21:45 nic, o 21:45 wiadomość L. o wyjściu', () => {
  const ok = okLeg1(); const early = atT(ok, 1304);
  expect(m3Check(early).state).toBe(early);
  const r = m3Check(atT(ok, 1305, 40));
  expect(m3(r.state)).toMatchObject({ leg: 2, noticed: true, notice: 1305, win: { start: 1310, len: 3 } });
  expect(r.state.sec).toBe(0);
  expect(lastMail(r.state)).toEqual({ from: 'L.', when: 'czw 21:45', html: 'Wychodzi za 5 minut, o <b>21:50</b>. Ta sama droga w drugą stronę: z 712 korytarzem B do windy.' });
  expect(r.state.mail.read).not.toContain('m3');
  expect(txt(r)).toBe('<span class="y">czw 21:45 · L.: wychodzi o 21:50. Ta sama droga, z 712 do windy.</span> <span class="d">Kamery na drodze wyłącz od 21:49, nie wcześniej.</span>');
  expect(r.ui).toEqual(expect.arrayContaining([{ kind: 'toast', text: 'L.: wychodzi o 21:50!', bad: true },
    { kind: 'open', app: 'plan' }, { kind: 'open', app: 'terminal' }]));
  expect(termStep(r.state)).toBe('powrót o 21:50: te same dwie kamery');
  expect(stageIndex(r.state)).toBe(5);
});
test('„⏩ Czekaj na wiadomość od L.” prowadzi prosto do wiadomości', () => {
  const r = clockJump(okLeg1());
  expect([r.state.t, m3(r.state).noticed]).toEqual([1305, true]);
  expect(r.ui).toContainEqual({ kind: 'toast', text: 'L.: wychodzi o 21:50!', bad: true });
});
test('po drugiej próbie wiadomość 28 min po jej końcu', () => {
  const s = withM3(okLeg1(), { err: 1, late: true, notice: 1335, win: { start: 1340, len: 3 } });
  const r = m3Check(atT(s, 1335));
  expect(lastMail(r.state).html).toContain('o <b>22:20</b>');
  expect(termStep(r.state)).toBe('powrót o 22:20: te same dwie kamery');
});
test('na żywo od wiadomości: 1 min gry = 30 s, zegar bez przycisku', () => {
  const b = back();
  expect([b.t, m3Live(b)]).toEqual([1305, true]);
  expect(realtimeTick(b, 1000).state.sec).toBe(2);
  const v = clockView(b)!;
  expect(v).toMatchObject({ time: '21:45:00', live: true, jump: null, html: 'okno <b>21:50–21:53</b> · za <b>5:00</b> · na żywo' });
  expect(v.note).toEqual({ tone: 'text', html: 'Wychodzi o 21:50. Połącz się: <code>use S1</code> (2 min).' });
  const on = run(b, 'use S1').state;                                                    // 21:47
  expect(clockView(on)!.note!.html).toBe('Wychodzi o 21:50. Kamery wyłącz od 21:49, nie wcześniej.');
  expect(clockView(atT(on, 1309))!.note!.html).toBe('Wychodzi o 21:50. Teraz: <code>cam off</code> dla kamer z drogi.');
  expect(clockView(atBack(on))!.note!.html).toBe('Wychodzi o 21:50. Zadania at wykonają się same.');
  expect(clockJump(b).state).toBe(b);
});
test('odświeżenie w minutach powrotu: pauza, bez drugiej wiadomości', () => {
  const b = deserialize(serialize(atT(back(), 1306, 30)))!;
  expect([b.t, b.sec, m3(b).noticed]).toEqual([1306, 30, true]);
  expect(holdsOnLoad(b)).toBe(true);
  const r = m3Check(b);
  expect(r.state).toBe(b); expect(r.ui).toEqual([]);
});
