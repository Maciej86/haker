// Plan 7. piętra Hotelu Luksus jako dane i SVG w napisie (renderPlan z makiety, linie 1748–1767).
import type { GameState } from '../../engine/types';
import type { PlanCam, PlanDot, PlanView } from '../../engine/missions';
import { gclk, hhmm } from '../../engine/clock';
import { camIsOff } from './state';
import { M3_PLAN_FOOTER } from './texts';

/** PCAM, linia 1748: położenie, kierunek patrzenia i podpis kamer. */
export const PLAN_CAMS: Record<string, { x: number; y: number; a: number; lbl: string }> = {
  '10.42.5.31': { x: 262, y: 184, a: 60, lbl: 'przy windzie' },
  '10.42.5.32': { x: 232, y: 138, a: 180, lbl: 'korytarz A' },
  '10.42.5.33': { x: 368, y: 138, a: 0, lbl: 'korytarz B' },
  '10.42.5.34': { x: 54, y: 138, a: 200, lbl: 'schody' },
};

/** ROUTE, linia 1749: winda → korytarz B → 712. */
export const PLAN_ROUTE: [number, number][] = [[300, 262], [300, 200], [300, 150], [548, 150], [548, 182]];

/** Pole widzenia kamery (linia 1751): trójkąt o promieniu 150 i rozwarciu ±38°. */
export function cone(c: { x: number; y: number; a: number }): string {
  const r = 150, sp = 38, a1 = ((c.a - sp) * Math.PI) / 180, a2 = ((c.a + sp) * Math.PI) / 180;
  return `${c.x},${c.y} ${c.x + r * Math.cos(a1)},${c.y + r * Math.sin(a1)} ${c.x + r * Math.cos(a2)},${c.y + r * Math.sin(a2)}`;
}

const lastOctet = (ip: string) => '.' + ip.split('.').pop();

const ROOMS =
  [[701, 24], [702, 92], [703, 160], [707, 392], [708, 460], [709, 528]]
    .map(([n, x]) => `<rect x="${x}" y="40" width="64" height="84" class="room"/><text x="${x + 32}" y="86" class="rn">${n}</text>`).join('') +
  [[704, 24], [705, 92], [706, 160], [710, 392], [711, 460], [712, 528]]
    .map(([n, x]) => `<rect x="${x}" y="166" width="64" height="84" class="room${n === 712 ? ' goal' : ''}"/><text x="${x + 32}" y="212" class="rn">${n}</text>`).join('');

const WALLS = '<defs><clipPath id="walls"><rect x="20" y="126" width="560" height="38"/><rect x="236" y="164" width="128" height="66"/><rect x="20" y="126" width="40" height="124"/></clipPath></defs>';
const FLOOR = '<rect x="20" y="126" width="560" height="38" class="corr"/><rect x="236" y="164" width="128" height="66" class="corr"/><rect x="270" y="230" width="60" height="44" class="lift"/><text x="300" y="258" class="rn">WINDA</text>'
  + '<rect x="20" y="126" width="40" height="124" class="stairs"/><text x="40" y="236" class="rn" style="font-size:9px">SCHODY</text>'
  + '<text x="140" y="150" class="cn">korytarz A</text><text x="470" y="150" class="cn">korytarz B</text>';
const ROUTE_SVG = `<polyline points="${PLAN_ROUTE.map((p) => p.join(',')).join(' ')}" class="route"/>`;

/** Widok planu piętra: SVG, kamery (adres po probe, wyłączenie z dziennika), wiersze stanu i stopka. */
export function m3PlanView(s: GameState, dot: PlanDot | null): PlanView {
  const m = s.mission.m3;
  const cams: PlanCam[] = Object.entries(PLAN_CAMS).map(([ip, c]) => ({
    ip, lbl: c.lbl, known: s.net.checked.includes(ip), off: camIsOff(m, ip, s.t),
  }));
  const camSvg = cams.map((k) => {
    const c = PLAN_CAMS[k.ip];
    const off = k.off ? ' off' : '';
    return `<polygon points="${cone(c)}" class="cone${off}" clip-path="url(#walls)"/><circle cx="${c.x}" cy="${c.y}" r="6" class="cam${off}"/>`
      + `<text x="${c.x}" y="${c.y - 10}" class="cl">${k.known ? lastOctet(k.ip) + ' ' : '? '}${k.lbl}${k.off ? ' · off' : ''}</text>`;
  }).join('');
  const dotSvg = dot ? `<circle cx="${dot.x}" cy="${dot.y}" r="7" class="dot${dot.seen ? ' seen' : ''}"/>` : '';
  const { start, len } = m.win;
  const jobs = m.log.filter((c) => c.src === 'at');
  return {
    svg: WALLS + ROOMS + FLOOR + ROUTE_SVG + camSvg + dotSvg,
    cams,
    rows: [
      { label: 'okno', value: `${hhmm(start)}–${hhmm(start + len)} · ${len} min${m.err > 0 ? ' · druga próba' : ''}`, coin: true },
      { label: 'teraz', value: gclk(s) },
      { label: 'zadania at', value: jobs.length ? jobs.map((c) => `${lastOctet(c.ip)} ${hhmm(c.off)}–${hhmm(c.on ?? c.off)}`).join(', ') : 'brak' },
    ],
    footer: M3_PLAN_FOOTER,
  };
}
