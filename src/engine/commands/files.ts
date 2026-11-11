import type { CommandTable } from '../terminal';
import type { GameState, Line, StepResult } from '../types';
import { andThen, step } from '../types';
import { esc } from '../text';
import { leaveS1 } from './field';
import { focusMission, missionHost } from '../missions';
import type { FileEvent, HostDef, HostFile } from '../missions';
import { onServer, withSrv } from '../server';
import { bankCat, bankGet, bankLs } from './server';

/** Host misji, na którym gracz jest teraz połączony (albo nic). */
function currentHost(s: GameState): HostDef | undefined {
  const loc = s.terminal.location;
  return loc.kind === 'host' ? missionHost(s, loc.ip) : undefined;
}

const afterEvent = (r: StepResult, host: HostDef | undefined, ev: FileEvent): StepResult =>
  host?.onFile ? andThen(r, (st) => host.onFile!(st, ev)) : r;

function notOnServer(s: GameState): StepResult {
  return step(s, [{ html: `<span class="r">Nie jesteś na serwerze.</span>` }]);
}

/** Plik z bieżącego hosta po nazwie z linii poleceń; albo gotowy wynik z komunikatem błędu. */
function pickFile(a: string | undefined, s: GameState): { host: HostDef; file: HostFile } | StepResult {
  const host = currentHost(s);
  if (!host) return notOnServer(s);
  if (!a) return step(s, [{ html: '<span class="r">Podaj nazwę pliku.</span>' }]);
  const file = host.files?.find((f) => f.name === a);
  if (!file) return step(s, [{ html: `<span class="r">Nie ma pliku ${esc(a)}.</span>` }]);
  return { host, file };
}

const isPick = (x: { host: HostDef; file: HostFile } | StepResult): x is { host: HostDef; file: HostFile } => 'file' in x;

/** Zejście z hosta o jeden poziom; z S1 schodzi `leaveS1` (field.ts). */
export function leaveHost(s: GameState): StepResult {
  const loc = s.terminal.location;
  if (loc.kind !== 'host') return step(s, [{ html: '<span class="d">Nie jesteś z niczym połączony.</span>' }]);
  const host = missionHost(s, loc.ip);
  if (loc.via === 'S1') {
    const lines: Line[] = [];
    const ui: StepResult['ui'] = [];
    if (s.srv.dl) {
      lines.push({ html: '<span class="r">Pobieranie przerwane.</span>' });
      ui.push({ kind: 'stopTimer', timer: 'download' });
    }
    const n = withSrv(
      { ...s, terminal: { ...s.terminal, location: { kind: 'S1' } } },
      { dl: null, mc: { ...s.srv.mc, open: false }, editor: null },
    );
    // linia 958 bez „Powrót na serwer: crack …” (Terminal nie podpowiada)
    lines.push({ html: `<span class="c">Rozłączono z ${loc.ip}.</span> <span class="d">Namierzanie opada. PODSŁUCH-1 nadal online.</span>` });
    return afterEvent(step(n, lines, ui), host, { cmd: 'disconnect' });
  }
  const left: GameState = { ...s, terminal: { ...s.terminal, location: { kind: 'home' } } };
  const got = s.downloads.some((f) => f.host === loc.ip);
  const r = step(left, [{
    html: `<span class="c">Rozłączono z ${loc.ip}.</span>${got ? ' <span class="d">Pliki czekają w Pobranych.</span>' : ''}`,
  }]);
  return afterEvent(r, host, { cmd: 'disconnect' });
}

export const FILE_COMMANDS: CommandTable = {
  ls: ([a], s) => {
    if (onServer(s)) return bankLs(s, a);
    const host = currentHost(s);
    if (!host) {
      const names = s.downloads.map((f) => f.name);
      return step(s, [{
        html: names.length
          ? `<span class="d">Pobrane:</span> ${names.map(esc).join('  ')}`
          : '<span class="d">dokumenty  pobrane (pusto)</span>',
      }]);
    }
    if (host.flat === false) return step(s);
    const rows = (host.files ?? []).map((f) => `${(`${f.kb} KB`).padEnd(8)}  ${f.name}`);
    const r = step(s, [{ html: ['<span class="d">rozmiar  plik</span>', ...rows].join('\n') }]);
    return afterEvent(r, host, { cmd: 'ls' });
  },
  cat: ([a], s) => {
    if (onServer(s)) return bankCat(s, a);
    const p = pickFile(a, s);
    if (!isPick(p)) return p;
    return step(s, [{ html: `<span class="d">── ${p.file.name} ──</span>\n${esc(p.file.body)}` }]);
  },
  get: ([a], s) => {
    if (onServer(s)) return bankGet(s, a);
    const p = pickFile(a, s);
    if (!isPick(p)) return p;
    const { host, file } = p;
    const fileId = `${host.ip}:${file.name}`;
    if (s.downloads.some((f) => f.fileId === fileId)) {
      return step(s, [{ html: '<span class="d">Ten plik już masz w Pobranych.</span>' }]);
    }
    const ref = { name: file.name, size: `${file.kb} KB`, mission: focusMission(s)!, host: host.ip, fileId };
    const next: GameState = { ...s, downloads: [...s.downloads, ref] };
    // Plik jest w Pobranych od razu; „Pobrano…” też trafia do stanu, a Terminal odsłania ją po pasku (makieta 1559–1563).
    const bar: Line = { html: `<span class="d">Pobieranie ${file.name} (${file.kb} KB)…</span> <span class="dl"><i></i></span>` };
    const done: Line = { html: `<span class="c">Pobrano: ${file.name}</span> <span class="d">→ Pobrane.</span>${file.gotNote ?? ''}` };
    const r = step(next, [bar, done], [{ kind: 'termHold', ms: 1000, steps: 4, bar, after: [done], toast: `Pobrano ${file.name}` }]);
    return afterEvent(r, host, { cmd: 'get', file });
  },
  disconnect: (_a, s) => (s.terminal.location.kind === 'S1' ? leaveS1(s) : leaveHost(s)),
};
