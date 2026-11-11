import '../../../src/missions';
import { expect, test } from 'vitest';
import { acceptOffer, clockJump, clockView } from '../../../src/engine/missions';
import { m3Jump } from '../../../src/missions/m3/clock';
import { m3Check } from '../../../src/missions/m3/window';
import { m3StartState } from '../../../src/missions/m3/dev';
import { atBothAt, atT, cams, home, run, txt } from './helpers';

test('zegar: odliczanie, przycisk do 21:10 przy drodze ręcznej', () => {
  const v = clockView(atT(home(cams()), 1200))!;
  expect(v).toMatchObject({ time: '20:00:00', html: 'okno <b>21:14–21:17</b> · za <b>1:14:00</b>', live: false, jump: '⏩ Przewiń do 21:10' });
  expect(v.note).toEqual({ tone: 'dim', html: 'Zostaną 4 min: <code>use S1</code> (2 min), potem <code>cam off</code> dla kamer z drogi, ale nie przed 21:13.' });
  expect(clockView(atT(cams(), 1200))!.note!.html).toContain(' Najpierw rozłączę cię z S1, żeby nie zużyć podsłuchu.');
  expect(clockView(m3StartState())).toBeNull();
  expect(clockView(acceptOffer(m3StartState(), 'm3').state)).toBeNull(); // etap 1: jeszcze bez podsłuchu
});
test('zadania at gotowe: przycisk do 21:13', () => {
  const v = clockView(atT(home(atBothAt(cams())), 1200))!;
  expect([v.jump, v.note!.html]).toEqual(['⏩ Przewiń do 21:13', 'Zadania at są gotowe.']);
});
test('na żywo: czerwony zegar, sekundy, podpowiedź', () => {
  const v = clockView(atT(cams(), 1271, 30))!;
  expect(v).toMatchObject({ time: '21:11:30', live: true, jump: null, html: 'okno <b>21:14–21:17</b> · za <b>2:30</b> · na żywo' });
  expect(v.note).toEqual({ tone: 'text', html: 'Czas płynie. Kamery wyłącz od 21:13, nie wcześniej.' });
  expect(clockView(atT(cams(), 1273))!.note!.html).toBe('Czas płynie. Teraz: <code>cam off</code> dla kamer z drogi.');
  expect(clockView(atT(home(cams()), 1272))!.note!.html).toBe('Czas płynie. Połącz się: <code>use S1</code>.');
  // [poprawka briefu] o 21:14:30 okno już trwa (makieta 1817: left ≤ 0); 30 s przed oknem to 21:13:30
  expect(clockView(atT(cams(), 1273, 30))!.html).toBe('okno <b>21:14–21:17</b> · za <b>0:30</b> · na żywo');
  expect(clockView(atT(cams(), 1274, 30))!.html).toBe('okno trwa · <b>21:17</b> koniec');
});
test('⚠ wyłączone blokuje przewijanie', () => {
  const s = run(atT(cams(), 1210), 'cam off 10.42.5.31').state;
  const v = clockView(s)!;
  expect(v.html).toContain('<br><span style="color:var(--red)">⚠ wyłączone: .31 włącz do 20:17</span>');
  expect(v.jump).toBeNull();
  expect(v.note).toEqual({ tone: 'red', html: 'Najpierw włącz kamery (<code>cam on</code>): po 7 min awarii ochrona sprawdza.' });
  expect(m3Jump(s).state).toBe(s);
  const ok = m3Check(atT(run(atT(cams(), 1273), 'cam off 10.42.5.31', 'cam off 10.42.5.33').state, 1275)).state;
  expect(clockView(ok)!.html).toContain('⚠ wyłączone: .31 włącz do 21:20, .33 włącz do 21:20');
  expect(clockView(ok)!.jump).toBeNull();
  const viaAt = run(atT(cams(), 1273), 'at 21:14 cam off 10.42.5.33 3m').state;
  expect(clockView(atT(viaAt, 1274))!.html).toContain('.33 (at, wróci 21:17)');
});
test('Przewiń: rozłącza z S1, przeskakuje, zapas nie maleje', () => {
  const s = atBothAt(cams()); const r = clockJump(s);
  expect([r.state.t, r.state.sec, r.state.terminal.location.kind, r.state.devices[0].minutes]).toEqual([1273, 0, 'home', 51]);
  expect(txt(r)).toContain('Rozłączono z PODSŁUCH-1.');
  expect(txt(r)).toContain('Czekasz do czw 21:13');
  expect(r.ui).toContainEqual({ kind: 'open', app: 'terminal' });
  expect(clockJump(home(cams())).state.t).toBe(1270);
});
test('Przewiń po celu: brak przycisku, bez zmian', () => {
  const s = atT(home(cams()), 1271);
  expect(clockView(s)!.jump).toBeNull();
  expect(clockJump(s).state).toBe(s);
});
test('etap 2: czekaj na wiadomość od L.', () => {
  const ok = m3Check(atT(home(atBothAt(cams())), 1275)).state;
  const v = clockView(ok)!;
  // [poprawka briefu] o 21:15 kamery z zadań at jeszcze nie wróciły, więc pod spodem jest ⚠ (makieta 1819)
  expect(v).toMatchObject({ jump: '⏩ Czekaj na wiadomość od L.' });
  expect(v.html).toBe('człowiek w <b>712</b> · L. napisze 5 min przed jego wyjściem<br><span style="color:var(--red)">⚠ wyłączone: .31 (at, wróci 21:17), .33 (at, wróci 21:17)</span>');
  expect(clockView(atT(ok, 1277))!.html).toBe('człowiek w <b>712</b> · L. napisze 5 min przed jego wyjściem');
  expect(v.note!.html).toBe('Kamery działają, ochrona nic nie widzi.');
  expect(clockJump(ok).state.t).toBe(1305);
});
test('poza misją i po porażce: brak zegara, Przewiń nic nie robi', () => {
  const s = { ...atT(home(cams()), 1200), failed: true };
  expect(clockView(s)).toBeNull();
  expect(clockJump(s).state).toBe(s);
});
