import { expect, test } from 'vitest';
import type { GameState } from '../../../src/engine/types';
import { runLine } from '../../../src/engine/terminal';
import { closeMc, closePreview, editorAct, mcInfo, mcRows, mcStatus } from '../../../src/engine/mc';
import { at, onBank, txt } from './helpers';

const inLogs = () => runLine(at(onBank(), '/it/logi'), 'edit auth.log').state; // +2%
const mine = (s: GameState) => s.srv.editor!.work.findIndex(l => l.me);
test('edit: kopia logu z moim wierszem z włamania, +2%', () => {
  const s = inLogs();
  expect(s.srv.trace).toBeCloseTo(2);
  expect(s.srv.editor!.work.filter(l => l.me).map(l => l.t)).toEqual([expect.stringContaining('dostęp do serwera plików')]);
  expect(s.srv.editor!.work.slice(0, 5).every(l => l.t.startsWith('czw '))).toBe(true);
  expect(s.srv.editor).toMatchObject({ dirty: false, fromMc: false });
  expect(runLine(at(onBank(), '/it/logi'), 'edit auth.log').lines).toEqual([]);
});
test('edit z mc: fromMc', () => {
  const s = runLine(runLine(at(onBank(), '/it/logi'), 'mc').state, 'edit auth.log').state;
  expect(s.srv.editor!.fromMc).toBe(true);
  const q = editorAct(s, { kind: 'quit' }).state;
  expect(q.srv.editor).toBeNull(); expect(q.srv.mc.open).toBe(true);
});
test('usuwam swój wiersz i zapisuję: czysto, +1% i +3%', () => {
  let s = editorAct(inLogs(), { kind: 'del', index: mine(inLogs()) }).state;
  expect(s.srv.editor!.dirty).toBe(true);
  const r = editorAct(s, { kind: 'save' });
  expect(r.state.srv).toMatchObject({ logClean: true, logBad: false, alert: false });
  expect(r.state.srv.trace).toBeCloseTo(6);
  expect(r.state.srv.editor!.dirty).toBe(false);
  expect(txt(r)).toContain('Zapisano auth.log.</span> <span class="d">Nie ma w nim twojego adresu.');
});
test('zapis bez zmian: mój wiersz zostaje', () => {
  const r = editorAct(inLogs(), { kind: 'save' });
  expect(r.state.srv.logClean).toBe(false);
  expect(txt(r)).toContain('<span class="y">W logu zostały wiersze z 10.42.0.250.</span>');
});
test('cudzy wiersz: czujny bank, toast', () => {
  const r = editorAct(editorAct(inLogs(), { kind: 'del', index: 0 }).state, { kind: 'save' });
  expect(r.state.srv).toMatchObject({ logBad: true, alert: true });
  expect(r.ui).toContainEqual({ kind: 'toast', text: 'Zniknęły cudze wpisy z logu. Bank coś zauważy.', bad: true });
});
test('wyjście bez zapisu porzuca zmiany', () => {
  const s = editorAct(inLogs(), { kind: 'del', index: 0 }).state; const r = editorAct(s, { kind: 'quit' });
  expect(r.state.srv.editor).toBeNull(); expect(r.state.srv.log).toHaveLength(s.srv.log.length);
  expect(r.state.srv.mc.open).toBe(false);
  expect(txt(r)).toContain('Wyjście bez zapisu: zmiany w auth.log porzucone.');
});
test('usuwanie z pustej kopii albo bez edytora: nic', () => {
  const s = onBank();
  expect(editorAct(s, { kind: 'del', index: 0 }).state).toBe(s);
});
test('usunięcie wiersza przy 99%: zerwanie, edytor zamknięty', () => {
  const s = { ...inLogs() }; const hot = { ...s, srv: { ...s.srv, trace: 99.5 } };
  const r = editorAct(hot, { kind: 'del', index: 0 });
  expect(r.state.terminal.location).toEqual({ kind: 'S1' });
  expect(r.state.srv.editor).toBeNull();
});
test('rm auth.log: cały plik, czujny bank, +3%', () => {
  const r = runLine(at(onBank(), '/it/logi'), 'rm auth.log');
  expect(r.state.srv).toMatchObject({ logBad: true, alert: true, logClean: false });
  expect(r.state.srv.trace).toBeCloseTo(3);
  expect(r.state.srv.log).toHaveLength(1);
  expect(r.state.srv.log[0].t).toContain('dziennik usunięty ręcznie');
  expect(txt(r)).toContain('auth.log usunięty.');
  expect(r.ui).toContainEqual({ kind: 'toast', text: 'Usunięcie logu wzbudziło podejrzenia', bad: true });
});
test('mc: wiersze, info, stan', () => {
  const s = runLine(at(onBank(), '/finanse/zestawienia/2026'), 'mc').state;
  const rows = mcRows(s);
  expect(rows.map(r => r.name)).toEqual(['..', 'wersje_robocze', 'zestawienie_oddzialow_2026.xlsx', 'zestawienie_oddzialow_2026_v2.xlsx', 'zestawienie_oddzialow_2026_FINAL.xlsx']);
  expect(rows[0].small).toBe('W GÓRĘ'); expect(rows[3].small).toBe('10-20');
  expect(rows[1]).toMatchObject({ dir: true, small: 'katalog', path: '/finanse/zestawienia/2026/wersje_robocze' });
  expect(mcInfo(s, rows[3])).toContain('Enter: szczegóły (info, +1%)');
  const k = runLine(s, `info ${rows[3].name}`).state;
  expect(mcInfo(k, rows[3])).toContain('zatwierdził <b>J. Nowak (dyr. finansowy)</b>');
  expect(mcStatus(k)).toContain('<span class="c">info zestawienie_oddzialow_2026_v2.xlsx</span> <span class="y">namierzanie +1%</span>');
  const p = runLine(k, `cat ${rows[3].name}`).state;
  expect(p.srv.mc.preview).toBe('/finanse/zestawienia/2026/zestawienie_oddzialow_2026_v2.xlsx');
  expect(closePreview(p).srv.mc).toEqual({ open: true, preview: null });
  expect(closeMc(k).srv.mc.open).toBe(false);
});
test('mc w /: bez .., status bez polecenia', () => {
  const s = runLine(onBank(), 'mc').state;
  expect(mcRows(s)[0].name).toBe('archiwum');
  expect(mcStatus(s)).toBe('polecenie: <span class="d">—</span>');
  expect(mcInfo(s, null)).toContain('Strzałki: wybór (za darmo)');
  expect(mcInfo(s, mcRows(s)[0])).toContain('nie byłeś tu jeszcze · Enter: cd (+2%)');
});
test('mc: pobrany plik i pasek pobierania', () => {
  const s = runLine(runLine(at(onBank(), '/archiwum'), 'mc').state, 'get zestawienie_oddzialow_2026_v2_kopia.xlsx').state;
  expect(mcStatus(s)).toContain(' · <span class="c">pobieranie zestawienie_oddzialow_2026_v2_kopia.xlsx: 0%</span>');
  const g = { ...s, downloads: [...s.downloads, { name: 'zestawienie_oddzialow_2026_v2_kopia.xlsx', size: '2,4 MB', mission: 'w' as const, host: '10.42.7.12', fileId: '10.42.7.12:zestawienie_oddzialow_2026_v2_kopia.xlsx' }] };
  expect(mcRows(g)[2]).toMatchObject({ got: true, small: 'pobrany' });
});
