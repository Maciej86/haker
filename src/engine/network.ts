import type { GameState, Line, StepResult } from './types';
import { andThen, step } from './types';
import { advance } from './clock';
import { esc } from './text';
import { focusMission, missionDef } from './missions';
import { gain } from './skills';
import { isLinkedToS1 } from './commands/basic';
import { useDevice } from './devices';
import { BRANCHES, SHAPES, SHAPE_NAMES, TOWER_NODES, hoursLabel } from '../world/tower';
import type { ShapeName, TowerNode } from '../world/tower';

export { TOWER_NODES };

export type ScanFilter = { net?: string; type?: ShapeName; off?: [number, number]; txt: string };
export type NetState = {
  scanned: boolean; filter: ScanFilter | null; checked: string[]; crossed: string[];
  routed: boolean; reusedBug: boolean; reuseAnnounced: boolean; s1Ms: number;
};

export function initNetState(): NetState {
  return { scanned: false, filter: null, checked: [], crossed: [], routed: false, reusedBug: false, reuseAnnounced: false, s1Ms: 0 };
}

const red = (html: string): Line[] => [{ html: `<span class="r">${html}</span>` }];
const NO_LINK = 'Brak połączenia.';

/** Baza + nakładka misji; kolejność wg BRANCHES, w podsieci w kolejności dopisania. */
export function netNodes(s: GameState): TowerNode[] {
  const extra = missionDef(focusMission(s))?.network?.addNodes ?? [];
  const order = BRANCHES.map((b) => b[0]);
  const rank = (n: TowerNode) => { const i = order.indexOf(n.net); return i < 0 ? order.length : i; };
  return [...TOWER_NODES, ...extra]
    .map((n, i) => ({ n, i }))
    .sort((a, b) => rank(a.n) - rank(b.n) || a.i - b.i)
    .map((x) => x.n);
}

export function isTarget(s: GameState, n: TowerNode): boolean {
  return missionDef(focusMission(s))?.network?.isTarget?.(s, n) ?? false;
}

export function parseFilter(args: string[]): { ok: true; filter: ScanFilter | null } | { ok: false; err: string } {
  const f: ScanFilter = { txt: args.join(' ').trim() };
  for (let i = 0; i < args.length; i++) {
    const k = args[i];
    const v = args[i + 1];
    if (k === '--net') {
      if (!/^10\.42\.\d+$/.test(v ?? '')) return { ok: false, err: 'Użycie: --net 10.42.7' };
      f.net = v.split('.')[2];
      i++;
    } else if (k === '--type') {
      if (v === undefined || !Object.hasOwn(SHAPES, v)) return { ok: false, err: `Typy: ${Object.keys(SHAPES).join(', ')}` };
      f.type = v as ShapeName;
      i++;
    } else if (k === '--off') {
      const m = /^(\d+)-(\d+)$/.exec(v ?? '');
      if (!m || +m[1] >= +m[2] || +m[2] > 24) return { ok: false, err: 'Użycie: --off 18-24 (godziny)' };
      f.off = [+m[1], +m[2]];
      i++;
    } else {
      return { ok: false, err: `Nieznana opcja ${esc(k)}. Opcje: --net, --type, --off` };
    }
  }
  return { ok: true, filter: args.length ? f : null };
}

export function matchNode(n: TowerNode, f: ScanFilter | null): boolean {
  return !f || (
    (!f.net || n.net === f.net)
    && (!f.type || n.sh === SHAPES[f.type])
    && (!f.off || n.akt.slice(f.off[0], f.off[1]).every((v) => !v))
  );
}

export function scanRows(s: GameState): Line[] {
  const all = netNodes(s);
  const f = s.net.filter;
  const list = all.filter((n) => matchNode(n, f));
  const head = `${f ? `<span class="d">Filtr: scan ${esc(f.txt)}</span> · ` : ''}Urządzeń: ${list.length}${f ? ' z ' + all.length : ''}\n<span class="d">IP            kształt     podsieć  aktywne</span>`;
  const rows = list.map((n) => {
    const base = n.ip.padEnd(14) + (n.sh + ' ' + SHAPE_NAMES[n.sh].split(' ')[0]).padEnd(12) + ('.' + n.net + '.x').padEnd(9) + hoursLabel(n);
    const who = s.net.checked.includes(n.ip)
      ? `  <span class="${isTarget(s, n) ? 'c' : 'r'}">${n.kto}</span>`
      : '';
    return { html: base + who };
  });
  return [{ html: head }, ...rows];
}

/** Koszt czasu gry i urządzenia naliczany po wypisaniu wyniku: zerwanie łącza trafia pod wynikiem. */
const afterResult = (r: StepResult, gameMin: number, deviceMin: number): StepResult =>
  andThen({ ...r, state: advance(r.state, gameMin) }, (x) => useDevice(x, deviceMin));

export function scan(s: GameState, args: string[]): StepResult {
  if (!isLinkedToS1(s)) return step(s, red(NO_LINK));
  const p = parseFilter(args);
  if (!p.ok) return step(s, red(p.err));
  if (s.net.scanned) {
    let n: GameState = { ...s, net: { ...s.net, filter: p.filter }, stats: { ...s.stats, scans: s.stats.scans + 1 } };
    let g = step(n);
    if (p.filter) g = gain(n, 'Linux', 0.2, 'filtry polecenia scan');
    n = g.state;
    return step(n, scanRows(n), [...g.ui, { kind: 'open', app: 'netmap' }]);
  }
  if (p.filter) return step(s, red('Filtry działają na wyniku skanu.'));
  const n: GameState = { ...s, net: { ...s.net, scanned: true }, stats: { ...s.stats, scans: s.stats.scans + 1 } };
  const lines: Line[] = [
    { html: '<span class="d">Skanowanie sieci za skrzynką S1… (3 min gry, 2 min urządzenia)</span>' },
    ...scanRows(n),
    { html: '<span class="c">Otwieram NetMap.</span>' },
  ];
  return afterResult(step(n, lines, [{ kind: 'open', app: 'netmap' }]), 3, 2);
}

export function probe(s: GameState, ip: string | undefined): StepResult {
  if (!s.net.scanned) return step(s, red('Nie znasz jeszcze tej sieci.'));
  const node = netNodes(s).find((x) => x.ip === ip);
  if (!node) return step(s, red(`Nie ma urządzenia ${esc(ip ?? '')} w wyniku skanu.`));
  if (s.net.checked.includes(node.ip)) {
    return step(s, [{ html: `<span class="d">${node.ip} już sprawdzony: ${node.kto}.</span>` }]);
  }
  if (!isLinkedToS1(s)) return step(s, red(NO_LINK));
  const n: GameState = { ...s, net: { ...s.net, checked: [...s.net.checked, node.ip] } };
  const def = missionDef(focusMission(s));
  const res: StepResult = def?.onProbe
    ? def.onProbe(n, node)
    : step(n, [{ html: `<span class="d">${node.ip} to ${node.kto}.</span>` }]);
  return afterResult(res, 6, 3);
}

const ROUTE = `<span class="d">Trasa z konta klienta Banku Wiślanego (2 min gry):</span>
   1  dom · Nowy Tomyśl          192.168.1.1
   2  Net-Operator · Poznań      83.12.40.1
   3  skrzynka S1 · Centrum      83.12.44.9
   4  <span class="c">przełącznik banku</span>          <span class="c">10.42.7.1</span>
   5  bankowość internetowa      10.42.7.20   <span class="d">← tu kończy się twój ruch</span>`;

export function route(s: GameState, args: string[]): StepResult {
  if (!/^bank/.test(args[0] ?? '')) return step(s, [{ html: 'Użycie: route bank' }]);
  const n = advance({ ...s, net: { ...s.net, routed: true } }, 2);
  return step(n, [{ html: ROUTE }]);
}

export function toggleCross(s: GameState, ip: string): GameState {
  const crossed = s.net.crossed.includes(ip) ? s.net.crossed.filter((x) => x !== ip) : [...s.net.crossed, ip];
  return { ...s, net: { ...s.net, crossed } };
}

export function clearFilter(s: GameState): GameState {
  return { ...s, net: { ...s.net, filter: null } };
}

