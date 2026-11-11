// Polecenia na serwerze z folderami (plan 21): cd, info, edit, rm, mc oraz gałąź drzewa dla ls i cat.
// Każde polecenie, które czyta serwer, podnosi namierzanie (`charge`); przy 100% zerwanie zamiast wyniku.
import type { CommandTable } from '../terminal';
import type { GameState, Line, StepResult } from '../types';
import { step } from '../types';
import { esc, fmt } from '../text';
import { children, resolvePath } from '../fstree';
import type { TreeFile } from '../fstree';
import { charge, onServer, srvHost, startGet, withSrv } from '../server';
import { catHtml, openEditor, removeLog } from '../mc';

const say = (s: GameState, html: string): StepResult => step(s, [{ html }]);
const cwdOf = (s: GameState): string => (s.terminal.location.kind === 'host' ? s.terminal.location.path : '/');
const addOnce = (xs: string[], x: string): string[] => (xs.includes(x) ? xs : [...xs, x]);

/** Plik z drzewa bieżącego serwera albo gotowa odmowa (linie 1246–1249, bez „Sprawdź: ls”). */
function srvFile(s: GameState, a: string | undefined): { path: string; file: TreeFile } | StepResult {
  if (!onServer(s)) return say(s, '<span class="r">Nie jesteś na serwerze z plikami.</span>');
  if (!a) return say(s, '<span class="r">Podaj plik, np. info nazwa.xlsx</span>');
  const path = resolvePath(cwdOf(s), a);
  const file = srvHost(s)!.tree![path];
  if (!file || file.kind !== 'file') return say(s, `<span class="r">Nie ma pliku „${esc(a)}” w ${esc(cwdOf(s))}.</span>`);
  return { path, file };
}
const isFile = (x: { path: string; file: TreeFile } | StepResult): x is { path: string; file: TreeFile } => 'file' in x;

/** Rozmiar pliku jak w makiecie: „2,4 MB”. */
export const mbText = (mb: number): string => `${fmt(mb)} MB`;

/** `ls [kat]` na serwerze (linie 933–938, 1259–1261). */
export function bankLs(s: GameState, a: string | undefined): StepResult {
  const host = srvHost(s)!;
  const d = a ? resolvePath(cwdOf(s), a) : cwdOf(s);
  if (host.tree![d]?.kind !== 'dir') return say(s, `<span class="r">ls: nie ma katalogu ${esc(a ?? '')}</span>`);
  const { r, caught } = charge(s, 1, 'ls' + (a ? ' ' + a : ''));
  if (caught) return r;
  const lines: Line[] = [{ html: `<span class="d">${host.ip}:${d}</span>` }];
  for (const k of children(host.tree!, d)) {
    if (k.node.kind === 'dir') { lines.push({ html: `<span class="c">${k.name}/</span>` }); continue; }
    const got = r.state.downloads.some((f) => f.fileId === `${host.ip}:${k.name}`);
    lines.push({ html: `${k.name.padEnd(42)}${mbText(k.node.mb).padEnd(10)}${k.node.date}${got ? '  <span class="c">pobrany</span>' : ''}` });
  }
  return step(r.state, lines, r.ui);
}

/** `cat <plik>` na serwerze: +3%, plik poznany, w mc także podgląd. */
export function bankCat(s: GameState, a: string | undefined): StepResult {
  const p = srvFile(s, a);
  if (!isFile(p)) return p;
  const { r, caught } = charge(s, 3, 'cat ' + p.file.name);
  if (caught) return r;
  const x = r.state;
  const n = withSrv(x, {
    known: addOnce(x.srv.known, p.file.name),
    mc: x.srv.mc.open ? { ...x.srv.mc, preview: p.path } : x.srv.mc,
  });
  return step(n, [{ html: catHtml(n, p.path) }], r.ui);
}

/** `get <plik>` na serwerze: pobieranie w czasie rzeczywistym. */
export function bankGet(s: GameState, a: string | undefined): StepResult {
  const p = srvFile(s, a);
  return isFile(p) ? startGet(s, p.path) : p;
}

/** Karta pliku (linie 1262–1266). */
function infoHtml(f: TreeFile): string {
  return `${f.name}
<span class="d">autor       </span>${f.author}
<span class="d">zmieniony   </span>${f.date}
<span class="d">zatwierdził </span>${f.approved === '—' ? '<span class="d">—</span>' : `<span class="c">${f.approved}</span>`}
<span class="d">uwagi       </span>${f.notes || '<span class="d">—</span>'}`;
}

export const SERVER_COMMANDS: CommandTable = {
  cd: ([a], s) => {
    // linia 939 bez „Najpierw włam się (crack).” (Terminal nie podpowiada)
    if (!onServer(s)) return say(s, '<span class="r">cd działa na serwerze.</span>');
    const d = resolvePath(cwdOf(s), a || '/');
    if (srvHost(s)!.tree![d]?.kind !== 'dir') return say(s, `<span class="r">cd: nie ma katalogu ${esc(a ?? '')}</span>`);
    const { r, caught } = charge(s, 2, 'cd ' + (a || '/'));
    if (caught) return r;
    const x = r.state;
    const loc = x.terminal.location;
    const moved: GameState = loc.kind === 'host' ? { ...x, terminal: { ...x.terminal, location: { ...loc, path: d } } } : x;
    return step(withSrv(moved, { seen: addOnce(x.srv.seen, d) }), [], r.ui);
  },
  info: ([a], s) => {
    const p = srvFile(s, a);
    if (!isFile(p)) return p;
    const { r, caught } = charge(s, 1, 'info ' + p.file.name);
    if (caught) return r;
    return step(withSrv(r.state, { known: addOnce(r.state.srv.known, p.file.name) }), [{ html: infoHtml(p.file) }], r.ui);
  },
  edit: ([a], s) => {
    const p = srvFile(s, a);
    if (!isFile(p)) return p;
    if (p.file.tag !== 'log') return say(s, `<span class="r">edit: ${p.file.name} jest tylko do odczytu dla twojego konta.</span>`);
    return openEditor(s, p.file.name);
  },
  rm: ([a], s) => {
    const p = srvFile(s, a);
    if (!isFile(p)) return p;
    if (p.file.tag !== 'log') return say(s, `<span class="r">rm: brak uprawnień do ${p.file.name}.</span>`);
    return removeLog(s, p.file.name);
  },
  mc: (_a, s) => {
    // linia 953 bez „Najpierw włam się (crack).”
    if (!onServer(s)) return say(s, '<span class="r">mc pokazuje pliki serwera.</span>');
    return step(withSrv(s, { mc: { open: true, preview: null }, editor: null }));
  },
};
