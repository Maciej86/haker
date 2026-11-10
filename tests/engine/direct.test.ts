import { expect, test } from 'vitest';
import { runLine, promptFor } from '../../src/engine/terminal';
import { stageIndex } from '../../src/engine/missions';
import type { GameState } from '../../src/engine/types';
import { kubaAccepted, withKuba, txt } from '../missions/kuba/helpers';
const wyt = (s: GameState): GameState => ({ ...s, owned: [...s.owned, 'wyt'] });

test('connect bez argumentu', () => {
  expect(txt(runLine(kubaAccepted(), 'connect'))).toBe('Użycie: connect &lt;ip&gt;. Adres serwera Zenka masz w Notatkach.');
});
test('connect na zły adres: 0 min, esc', () => {
  const s = kubaAccepted(); const r = runLine(s, 'connect <b>1.2.3.4');
  expect(r.state.t).toBe(s.t);
  expect(txt(r)).toContain('connect: brak odpowiedzi od &lt;b&gt;1.2.3.4.');
});
test('connect bez hasła: 1 min, conn, etap 2', () => {
  const s = kubaAccepted(); const r = runLine(s, 'connect 83.21.40.17');
  expect(r.state.t).toBe(s.t + 1);
  expect(r.state.mission.kuba.conn).toBe(true);
  expect(r.state.terminal.location).toEqual({ kind: 'home' });
  expect(txt(r)).toContain('hasło: <span class="r">✕ nie znasz hasła. Połączenie zamknięte.</span>');
  expect(txt(r)).toContain('Wytrych kupisz w Darknecie.');
  expect(stageIndex(r.state)).toBe(2);
});
test('connect z Wytrychem: podpowiedź crack, etap 3', () => {
  const r = runLine(wyt(kubaAccepted()), 'connect 83.21.40.17');
  expect(txt(r)).toContain('<span class="y">Złam hasło: crack 83.21.40.17</span>');
  expect(stageIndex(r.state)).toBe(3);
});
test('crack bez Wytrycha', () => {
  expect(txt(runLine(kubaAccepted(), 'crack 83.21.40.17'))).toContain('crack: nie znaleziono polecenia.');
});
test('crack bez connect: 1 min, otwiera Wytrych, etap 3', () => {
  const s = wyt(kubaAccepted()); const r = runLine(s, 'crack 83.21.40.17');
  expect(r.state.t).toBe(s.t + 1);
  expect(r.state.mission.kuba).toMatchObject({ conn: true, open: true });
  expect(r.ui).toContainEqual({ kind: 'open', app: 'wytrych' });
  expect(txt(r)).toContain('zabezpieczenie: hasło z podpowiedzią');
  expect(stageIndex(r.state)).toBe(3);
});
test('po złamaniu: connect loguje, crack bez kosztu, drugi connect „Już połączono”', () => {
  const s = withKuba(wyt(kubaAccepted()), { conn: true, cracked: true });
  const c = runLine(s, 'connect 83.21.40.17');
  expect(c.state.terminal.location).toEqual({ kind: 'host', ip: '83.21.40.17', path: '~', via: 'direct' });
  expect(promptFor(c.state)).toBe('zenek:~ >');
  expect(txt(c)).toContain('Hasło już znasz.');
  expect(txt(c)).not.toContain('Pliki: ls');
  const k = runLine(s, 'crack 83.21.40.17');
  expect(k.state.t).toBe(s.t);
  expect(txt(k)).toContain('Hasło już złamane.');
  expect(txt(k)).not.toContain('connect');
  expect(txt(runLine(c.state, 'connect 83.21.40.17'))).toContain('Już połączono.');
});
