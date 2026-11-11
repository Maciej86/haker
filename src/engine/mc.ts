// Widok plików serwera w oknie Terminala (plan 21): wiersze mc, pasek info i stanu, podgląd, edytor auth.log.
// Czyste funkcje na `s.srv`; UI tylko rysuje wynik (misja.html 1336–1404).
import type { GameState, StepResult } from './types';
import { step } from './types';
import { esc, fmt } from './text';
import { children } from './fstree';
import { gclk } from './clock';
import { charge, closeSession, dlProgress, onServer, srvHost, treeHost, withSrv } from './server';
import type { LogLine } from './server';

/** Treść pliku do Terminala i podglądu F3 (linia 1267); auth.log z wierszy `srv.log`. */
export function catHtml(s: GameState, path: string): string {
  const f = treeHost(s)?.tree?.[path];
  if (!f || f.kind !== 'file') return '';
  if (f.tag === 'log') return esc(s.srv.log.map((l) => l.t).join('\n'));
  return `<span class="d">── ${f.name} ──</span>\n${esc(f.body)}`;
}

export type McRow = { name: string; path: string; up: boolean; dir: boolean; got: boolean; small: string };

const cwdOf = (s: GameState): string => (s.terminal.location.kind === 'host' ? s.terminal.location.path : '/');
const parent = (p: string): string => p.replace(/\/[^/]+$/, '') || '/';

/** Wiersze lewego panelu: `..` (poza `/`), potem dzieci katalogu (linie 1339, 1358). */
export function mcRows(s: GameState): McRow[] {
  const host = srvHost(s);
  if (!host?.tree) return [];
  const cwd = cwdOf(s);
  const rows: McRow[] = cwd === '/' ? [] : [{ name: '..', path: parent(cwd), up: true, dir: true, got: false, small: 'W GÓRĘ' }];
  for (const k of children(host.tree, cwd)) {
    if (k.node.kind === 'dir') {
      rows.push({ name: k.name, path: k.path, up: false, dir: true, got: false, small: 'katalog' });
      continue;
    }
    const got = s.downloads.some((d) => d.fileId === `${host.ip}:${k.name}`);
    rows.push({ name: k.name, path: k.path, up: false, dir: false, got, small: got ? 'pobrany' : k.node.date.slice(5) });
  }
  return rows;
}

/** Pasek info pod panelami dla zaznaczonego wiersza (linie 1352–1356). */
export function mcInfo(s: GameState, row: McRow | null): string {
  if (!row) return '<span class="d">Strzałki: wybór (za darmo) · Enter: folder → wejdź, plik → szczegóły</span>';
  if (row.up) return '<span class="d">katalog wyżej · Enter: cd ..</span>';
  if (row.dir) {
    const seen = s.srv.seen.includes(row.path);
    return `<span class="d">katalog</span> <b>${esc(row.name)}/</b>${seen ? '' : ' <span class="d">· nie byłeś tu jeszcze · Enter: cd (+2%)</span>'}`;
  }
  const f = srvHost(s)?.tree?.[row.path];
  if (!f || f.kind !== 'file') return '';
  if (s.srv.known.includes(row.name)) {
    return `autor <i>${esc(f.author)}</i> · zmieniony <i>${esc(f.date)}</i> · zatwierdził ${f.approved === '—' ? '<i>—</i>' : `<b>${esc(f.approved)}</b>`}${f.notes ? ` · <b>${esc(f.notes)}</b>` : ''}`;
  }
  return `<i>${esc(row.name)}</i> · ${fmt(f.mb)} MB · ${esc(f.date)} <span class="d">· Enter: szczegóły (info, +1%)</span>`;
}

/** Pasek stanu: ostatnie polecenie z kosztem i pobieranie w toku (linie 1343–1345). */
export function mcStatus(s: GameState): string {
  const L = s.srv.lastCmd;
  const p = dlProgress(s);
  const dl = s.srv.dl && p !== null
    ? ` · <span class="c">pobieranie ${esc(s.srv.dl.path.split('/').pop() ?? '')}: ${p}%</span>` : '';
  const cmd = L
    ? `<span class="c">${esc(L.cmd)}</span>${L.v != null ? ` <span class="y">namierzanie +${fmt(L.v)}%</span>` : ''}`
    : '<span class="d">—</span>';
  return `polecenie: ${cmd}${dl}`;
}

/** F10/Esc w mc: zamyka widok, podgląd i edytor. */
export const closeMc = (s: GameState): GameState => closeSession(s);

/** Esc/F3/F10 w podglądzie: powrót do paneli. */
export const closePreview = (s: GameState): GameState => withSrv(s, { mc: { ...s.srv.mc, preview: null } });

/** `edit <log>`: +2%, kopia robocza logu (linia 950). */
export function openEditor(s: GameState, name: string): StepResult {
  const { r, caught } = charge(s, 2, 'edit ' + name);
  if (caught) return r;
  const x = r.state;
  return step(withSrv(x, { editor: { work: [...x.srv.log], dirty: false, fromMc: x.srv.mc.open } }), [], r.ui);
}

/** `rm <log>`: +3%, cały dziennik znika, system zakłada nowy, bank czujniejszy (linie 1400–1401). */
export function removeLog(s: GameState, name: string): StepResult {
  const { r, caught } = charge(s, 3, 'rm ' + name);
  if (caught) return r;
  const x = r.state;
  const line: LogLine = { id: x.srv.logSeq, t: `${gclk(x).padEnd(9)}  system        —            dziennik usunięty ręcznie` };
  const n = withSrv(x, { log: [line], logSeq: x.srv.logSeq + 1, logBad: true, alert: true, logClean: false });
  return step(n, [{
    html: '<span class="r">auth.log usunięty.</span> <span class="d">System założył nowy z wpisem o usunięciu. Bank jest czujniejszy.</span>',
  }], [...r.ui, { kind: 'toast', text: 'Usunięcie logu wzbudziło podejrzenia', bad: true }]);
}

export type EditorAction = { kind: 'del'; index: number } | { kind: 'save' } | { kind: 'quit' };

/** Klawisze edytora auth.log: usuń wiersz (+1%), zapisz (+3%), wyjdź (linie 1391–1399). */
export function editorAct(s: GameState, a: EditorAction): StepResult {
  const ed = s.srv.editor;
  if (!ed || !onServer(s)) return step(s);
  if (a.kind === 'del') {
    if (!ed.work.length || a.index < 0 || a.index >= ed.work.length) return step(s);
    const { r, caught } = charge(s, 1, 'usunięto wiersz');
    if (caught) return r;
    const work = ed.work.filter((_, i) => i !== a.index);
    return step(withSrv(r.state, { editor: { ...ed, work, dirty: true } }), [], r.ui);
  }
  if (a.kind === 'save') {
    const { r, caught } = charge(s, 3, 'zapis auth.log');
    if (caught) return r;
    const x = r.state;
    const ids = new Set(ed.work.map((l) => l.id));
    const ui = [...r.ui];
    let p: Partial<GameState['srv']> = {};
    if (x.srv.log.some((l) => !ids.has(l.id) && !l.me) && !x.srv.logBad) {
      p = { logBad: true, alert: true };
      ui.push({ kind: 'toast', text: 'Zniknęły cudze wpisy z logu. Bank coś zauważy.', bad: true });
    }
    const logClean = !ed.work.some((l) => l.me);
    const n = withSrv(x, { ...p, log: ed.work, logClean, editor: { ...ed, dirty: false } });
    return step(n, [{
      html: `<span class="c">Zapisano auth.log.</span> ${logClean
        ? '<span class="d">Nie ma w nim twojego adresu. Każda kolejna akcja dopisze nowy wiersz.</span>'
        : '<span class="y">W logu zostały wiersze z 10.42.0.250.</span>'}`,
    }], ui);
  }
  const lines = ed.dirty ? [{ html: '<span class="y">Wyjście bez zapisu: zmiany w auth.log porzucone.</span>' }] : [];
  const mc = ed.fromMc ? s.srv.mc : { open: false, preview: null };
  return step(withSrv(s, { editor: null, mc }), lines);
}
