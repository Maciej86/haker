import { expect, test } from 'vitest';
import { runLine } from '../../src/engine/terminal';
import { stageIndex } from '../../src/engine/missions';
import { kubaAccepted, withKuba, txt, run } from '../missions/kuba/helpers';

const onZenek = () => runLine(withKuba({ ...kubaAccepted(), owned: ['cpu1', 'net2', 'wyt'] }, { conn: true, cracked: true }), 'connect 83.21.40.17').state;

test('ls na serwerze: 4 pliki, 0 min, Linux +0,2 raz', () => {
  const s = onZenek(); const r = runLine(s, 'ls');
  expect(r.state.t).toBe(s.t);
  expect(txt(r)).toContain('4 KB      playlista.txt');
  expect(txt(r)).toContain('1 KB      podpowiedz_hasla.txt');
  expect(r.state.skills.Linux).toBeCloseTo(1.7);
  expect(runLine(r.state, 'ls').state.skills.Linux).toBeCloseTo(1.7);
});
test('cat: treść, esc w nazwie, brak nazwy', () => {
  expect(txt(runLine(onZenek(), 'cat zamowienia_sobota.txt'))).toContain('Kuba – 20 pączków (impreza?) – gotówka');
  expect(txt(runLine(onZenek(), 'cat <b>x'))).toBe('<span class="r">Nie ma pliku &lt;b&gt;x. Lista: ls</span>');
  expect(txt(runLine(onZenek(), 'get'))).toBe('<span class="r">Podaj nazwę pliku. Lista: ls</span>');
});
test('cat poza serwerem', () => {
  expect(txt(runLine(kubaAccepted(), 'cat playlista.txt'))).toBe('<span class="r">Nie jesteś na serwerze.</span>');
});
test('get playlisty: FileRef, toast, etap 5, drugi get odmawia', () => {
  const s = onZenek(); const r = runLine(s, 'get playlista.txt');
  expect(r.state.downloads).toEqual([{ name: 'playlista.txt', size: '4 KB', mission: 'kuba', host: '83.21.40.17', fileId: '83.21.40.17:playlista.txt' }]);
  expect(r.state.t).toBe(s.t);
  expect(r.ui).not.toContainEqual({ kind: 'toast', text: 'Pobrano playlista.txt' });
  expect(r.ui).toContainEqual({ kind: 'termHold', ms: 1000, steps: 4, bar: r.lines[0], after: [r.lines[1]], toast: 'Pobrano playlista.txt' });
  expect(txt(r)).not.toContain('Teraz disconnect');
  expect(stageIndex(r.state)).toBe(5);
  expect(txt(runLine(r.state, 'get playlista.txt'))).toBe('<span class="d">Ten plik już masz w Pobranych.</span>');
});
test('disconnect po pobraniu: dom, Linux +0,3, disc', () => {
  const r = runLine(run(onZenek(), 'get playlista.txt').state, 'disconnect');
  expect(r.state.terminal.location).toEqual({ kind: 'home' });
  expect(r.state.mission.kuba.disc).toBe(true);
  expect(r.state.gains).toContainEqual({ sk: 'Linux', v: 0.3, why: 'pobranie i czyste rozłączenie' });
  expect(txt(r)).toContain('Rozłączono z 83.21.40.17.</span> <span class="d">Pliki czekają w Pobranych.');
});
test('disconnect bez pobrania: bez przyrostu; drugi raz: nic', () => {
  const r = runLine(onZenek(), 'disconnect');
  expect(r.state.gains.some(g => g.why === 'pobranie i czyste rozłączenie')).toBe(false);
  expect(txt(runLine(r.state, 'disconnect'))).toBe('<span class="d">Nie jesteś z niczym połączony.</span>');
});
test('ls w domu pokazuje Pobrane', () => {
  expect(txt(runLine(kubaAccepted(), 'ls'))).toBe('<span class="d">dokumenty  pobrane (pusto)</span>');
  expect(txt(runLine(run(onZenek(), 'get playlista.txt', 'disconnect').state, 'ls'))).toBe('<span class="d">Pobrane:</span> playlista.txt');
});
test('get: linia „Pobieranie” z pustym paskiem, „Pobrano” już w stanie (odsłaniana po pobieraniu)', () => {
  const r = runLine(onZenek(), 'get playlista.txt');
  expect(r.lines).toHaveLength(2);
  expect(r.lines[0].html).toBe('<span class="d">Pobieranie playlista.txt (4 KB)…</span> <span class="dl"><i></i></span>');
  expect(r.lines[1].html).toBe('<span class="c">Pobrano: playlista.txt</span> <span class="d">→ Pobrane.</span>');
  expect(r.ui.filter((e) => e.kind === 'termHold')).toHaveLength(1);
  expect(r.ui.some((e) => e.kind === 'startTimer' || e.kind === 'stopTimer')).toBe(false);
});
