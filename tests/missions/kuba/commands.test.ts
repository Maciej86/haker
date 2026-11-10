import { expect, test } from 'vitest';
import { runLine } from '../../../src/engine/terminal';
import { kubaAccepted, txt, withKuba } from './helpers';
import { newGame } from '../../../src/engine/state';
import { K_NOTHERE, K_FLAT } from '../../../src/missions/kuba/texts';

test.each(['scan', 'use S1', 'probe 10.42.7.12', 'route bank'])('%s → Tego teraz nie potrzebujesz', cmd => {
  const s = kubaAccepted(); const r = runLine(s, cmd);
  expect(txt(r)).toBe(K_NOTHERE); expect(r.state.t).toBe(s.t);
});
test.each(['mc', 'cd /', 'info playlista.txt'])('%s → płaska lista', cmd => {
  expect(txt(runLine(kubaAccepted(), cmd))).toBe(K_FLAT);
});
test('działa też przed odpowiedzią Kubie', () => { expect(txt(runLine(newGame(1), 'scan'))).toBe(K_NOTHERE); });
test('edit i rm odmawiają', () => {
  expect(txt(runLine(kubaAccepted(), 'edit playlista.txt'))).toContain('Niczego nie zmieniaj u Zenka.');
  expect(txt(runLine(kubaAccepted(), 'rm playlista.txt'))).toContain('Niczego nie usuwaj u Zenka.');
});
test('help: crack dopiero z Wytrychem', () => {
  const s = kubaAccepted();
  expect(txt(runLine(s, 'help'))).not.toContain('crack &lt;ip&gt;');
  expect(txt(runLine({ ...s, owned: [...s.owned, 'wyt'] }, 'help'))).toContain('crack &lt;ip&gt;        włamanie: Wytrych łamie hasło serwera');
});
test('status poza serwerem', () => { expect(txt(runLine(kubaAccepted(), 'status'))).toBe('<span class="d">Brak połączenia.</span>'); });
test('status na serwerze Zenka', () => {
  const s0 = withKuba(kubaAccepted(), { cracked: true });
  const s = { ...s0, terminal: { ...s0.terminal, location: { kind: 'host' as const, ip: '83.21.40.17', path: '~', via: 'direct' as const } } };
  expect(txt(runLine(s, 'status'))).toBe('<span class="c">Połączono z 83.21.40.17</span> · serwer domowy Zenka · <span class="d">namierzanie: brak (prywatny serwer nikogo nie pilnuje)</span>');
});
test('devices i abort', () => {
  expect(txt(runLine(kubaAccepted(), 'devices'))).toBe('<span class="d">Nie masz jeszcze urządzeń w terenie.</span>');
  expect(txt(runLine(kubaAccepted(), 'abort'))).toBe('<span class="d">Nic nie trwa.</span>');
});
test('nieznane polecenie nadal daje błąd', () => {
  expect(txt(runLine(kubaAccepted(), 'xyz'))).toBe('xyz: nie znaleziono polecenia. Wpisz help.');
});
