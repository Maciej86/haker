import '../../../src/missions';
import { expect, test } from 'vitest';
import { runLine } from '../../../src/engine/terminal';
import { missionDef } from '../../../src/engine/missions';
import { m3StartState } from '../../../src/missions/m3/dev';
import { atT, cams, home, m3, run, txt } from './helpers';

// Terminal nie podpowiada: z linii makiety 1777, 1778, 1780, 1787, 1792, 1793 pominięte porady
// („Najpierw: …”, „włącz ją najpóźniej o … (cam on …)”, „Lista: at”, „Teraz kliknij „⏩ Przewiń…” …”).
test('cam off / on od razu, bez kosztu', () => {
  const s = atT(cams(), 1273); const a = runLine(s, 'cam off 10.42.5.31');
  expect(a.state.t).toBe(1273);
  expect(txt(a)).toBe('<span class="y">czw 21:13 · kamera 10.42.5.31 wyłączona.</span> <span class="d">Ochrona widzi „brak sygnału”. Po 7 min awarii idzie sprawdzić.</span>');
  expect(txt(runLine(a.state, 'cam off 10.42.5.31'))).toBe('<span class="d">10.42.5.31 już wyłączona.</span>');
  expect(txt(runLine(a.state, 'cam on 10.42.5.31'))).toBe('<span class="c">czw 21:13 · kamera 10.42.5.31 znowu działa.</span>');
  expect(txt(runLine(s, 'cam on 10.42.5.31'))).toBe('<span class="d">10.42.5.31 działa.</span>');
});
test('cam: brak połączenia, nieznane urządzenie, nie kamera', () => {
  expect(txt(runLine(home(cams()), 'cam off 10.42.5.31'))).toBe('<span class="r">Brak połączenia.</span>');
  expect(txt(runLine(cams(), 'cam off <b>x'))).toBe('<span class="r">Nie znasz urządzenia &lt;b&gt;x.</span>');
  expect(txt(runLine(cams(), 'cam off 10.42.5.4'))).toContain('10.42.5.4 to nie kamera');
  expect(txt(runLine(cams(), 'cam'))).toBe('Użycie: cam off &lt;ip&gt; · cam on &lt;ip&gt;');
});
test('at zapisuje zadanie, 1 min gry, lista', () => {
  const s = cams(); const a = runLine(s, 'at 21:14 cam off 10.42.5.31 3m');
  expect([a.state.t - s.t, a.state.devices[0].minutes]).toEqual([1, 51]);
  expect(m3(a.state).log).toEqual([{ ip: '10.42.5.31', off: 1274, on: 1277, src: 'at' }]);
  expect(txt(a)).toBe('<span class="c">Zadanie zapisane na PODSŁUCHU-1:</span> czw 21:14 cam off 10.42.5.31 na 3 min. <span class="d">Wykona się także po rozłączeniu.</span>');
  const b = runLine(a.state, 'at 21:14 cam off 10.42.5.33 3m');
  expect(txt(b)).toContain('<span class="y">Obie kamery z drogi mają zadania.</span>');
  expect(txt(b)).not.toContain('Przewiń');
  expect(runLine(b.state, 'at').lines.map(l => l.html)).toEqual(['1. czw 21:14  cam off 10.42.5.31  3m', '2. czw 21:14  cam off 10.42.5.33  3m']);
  expect(txt(runLine(s, 'at'))).toBe('<span class="d">Brak zadań.</span>');
});
test('at: złe argumenty bez kosztu', () => {
  const s = cams(); const no = (cmd: string, out: string) => { const r = runLine(s, cmd); expect(txt(r)).toBe(out); expect(r.state.t).toBe(s.t); };
  no('at 25:00 cam off 10.42.5.31 3m', 'Użycie: at 21:14 cam off &lt;ip&gt; 3m');
  no('at 21:14 cam off 10.42.5.31 8m', '<span class="r">Czas od 1m do 7m. Dłuższą awarię ochrona sprawdzi.</span>');
  no('at 21:14 cam off 10.42.5.31 0m', '<span class="r">Czas od 1m do 7m. Dłuższą awarię ochrona sprawdzi.</span>');
  no('at 21:14 cam off 10.42.5.4 3m', '<span class="r">10.42.5.4 to nie znana kamera.</span>');
  no('at 21:14 cam off <i>y 3m', '<span class="r">&lt;i&gt;y to nie znana kamera.</span>');
  no('at 17:00 cam off 10.42.5.31 3m', '<span class="r">Ta godzina już minęła.</span>');
  no('wait 17:00', '<span class="r">Ta godzina już minęła.</span>');
  no('wait', 'Użycie: wait 21:10 (czekasz do tej godziny)');
  expect(txt(runLine(home(s), 'at 21:14 cam off 10.42.5.31 3m'))).toBe('<span class="r">Zadanie zapisuje się na PODSŁUCHU-1.</span>');
});
test('wait: rozłączony nie zużywa, połączony zużywa zapas', () => {
  const off = runLine(home(atT(cams(), 1200)), 'wait 21:00');
  expect([off.state.t, off.state.sec, off.state.devices[0].minutes]).toEqual([1260, 0, 51]);
  expect(txt(off)).toBe('<span class="d">Czekasz do czw 21:00 (1 h 0 min).</span>');
  const on = runLine(atT(cams(), 1200, 40), 'wait 20:10');
  expect([on.state.t, on.state.sec, on.state.devices[0].minutes]).toEqual([1210, 0, 41]);
  expect(txt(on)).toContain('<span class="y">PODSŁUCH-1 był cały czas połączony: −10 min zapasu.</span>');
});
test('wait ponad zapas: zerwanie, zadania at przepadają, cam bez połączenia', () => {
  const s = run(cams(), 'at 21:14 cam off 10.42.5.31 3m', 'at 21:14 cam off 10.42.5.33 3m').state; // 17:49, zapas 51
  const r = runLine(s, 'wait 21:00');
  expect([r.state.t, r.state.devices[0].minutes, r.state.terminal.location.kind]).toEqual([1260, 0, 'home']);
  const h = txt(r);
  expect(h).toContain('−51 min zapasu');
  expect(h).toContain('PODSŁUCH-1 wyczerpany. Połączenie z siecią za S1 zerwane.');
  expect(h).toContain('<span class="r">Zadania at przepadły: PODSŁUCH-1 wyczerpany.</span>');
  expect(h.indexOf('Czekasz')).toBeLessThan(h.indexOf('zerwane'));
  expect(h.indexOf('zerwane')).toBeLessThan(h.indexOf('Zadania at przepadły'));
  expect(m3(r.state).log).toEqual([]);
  expect(txt(runLine(r.state, 'cam off 10.42.5.31'))).toBe('<span class="r">Brak połączenia z S1: PODSŁUCH-1 wyczerpany.</span>');
  expect(txt(runLine(r.state, 'at 21:14 cam off 10.42.5.31 3m'))).toBe('<span class="r">Brak połączenia z S1: PODSŁUCH-1 wyczerpany.</span>');
});
test('poza misją L. nie ma poleceń kamer; Ściąga', () => {
  expect(txt(runLine(m3StartState(), 'wait 21:00'))).not.toContain('Czekasz');
  const afterW = { ...m3StartState(), done: ['kuba' as const, 'w' as const] }; // oferta L. jedyna: focus, ale nieprzyjęta
  expect(txt(runLine(afterW, 'wait 21:00'))).toBe('wait: nie znaleziono polecenia. Wpisz help.');
  const g = missionDef('m3').help.find(h => h.title === 'Kamery (zlecenie L.)')!;
  expect(g.entries.map(e => [e.cmd, e.cost])).toEqual([['cam off 10.42.5.31', 'wymaga połączenia z S1'],
    ['at 21:14 cam off 10.42.5.31 3m', '1 min gry'], ['wait 21:10', '']]);
  expect(g.need).toBe('w zleceniu L.');
  expect(g.unlocked(cams())).toBe(true);
  expect(g.unlocked(m3StartState())).toBe(false);
});
