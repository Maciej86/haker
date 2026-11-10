// Rysowanie miast w izometrii: port drawScene (mapa-miasta.html 301–402), drawCity i boxSvg (493–549).
// Zawsze tryb gry (app=1): bez pięter, obwódki, etykiety i znacznika celu. Kolory tylko z tokenów CSS
// (src/theme/map-tokens.css); kolor równy tokenowi bazowemu to token bazowy (--acc, --coin, --bg…).
import { DISTRICT_META, DKEYS } from './meta';
import type { Box, CityView, Scene } from './types';

type XY = [number, number];
type BB = [number, number, number, number];

const FLOOR = 6;
export const P = (x: number, y: number, z = 0): XY => [(x - y) * .866, (x + y) * .5 - z];
const f = (v: number) => v.toFixed(1);
const sec = (n: number) => '▮'.repeat(n) + '▯'.repeat(3 - n);
const V = (t: string) => `var(--${t})`;
/** Atrybut style z wypełnieniem i obrysem (wartości to var(--…) albo none). */
const sty = (fill?: string, stroke?: string) =>
  `style="${[fill && `fill:${fill}`, stroke && `stroke:${stroke}`].filter(Boolean).join(';')}"`;

interface Pal { roof: string; w1: string; w2: string; st: string; win: string | null; bands?: boolean }
const pal = (k: string, win = true, bands = false): Pal => ({
  roof: V(`map-${k}-roof`), w1: V(`map-${k}-w1`), w2: V(`map-${k}-w2`), st: V(`map-${k}-st`),
  win: win ? V(`map-${k}-win`) : null, bands,
});
const PAL: Record<string, Pal> = {
  old: pal('old'), modern: pal('modern', true, true), tower: pal('tower', true, true), podium: pal('podium', true, true),
  antenna: pal('antenna', false), slab: pal('slab'), school: pal('school'), market: pal('market', false),
  house: pal('house'), hip: pal('hip'), place: pal('place'), shed: pal('shed', false), roofbit: pal('roofbit', false),
  src: pal('src', false),
};
const HOME = pal('home');
const g2 = (k: string, extra = '') => `${sty(V(`map-g-${k}`), V(`map-g-${k}-edge`))}${extra}`;
const GSTYLE: Record<string, string> = {
  paved: g2('paved'), lot: g2('lot', ' stroke-dasharray="3 3"'), garden: g2('garden', ' stroke-dasharray="2 2"'),
  pitch: g2('pitch'), park: g2('park'), play: g2('play'), square: g2('square'), plaza: g2('plaza'),
};
const HALO = V('bg');

export interface SceneDrawOptions { mini?: boolean; hideStart?: boolean; hideAirport?: boolean; hideSources?: boolean }

type Item =
  | { k: number; b: Box & { col?: number; k?: string; sec?: number }; i?: number; t?: undefined; m?: undefined }
  | { k: number; t: { x: number; y: number }; b?: undefined; m?: undefined; i?: undefined }
  | { k: number; m: { k: string; x: number; y: number; sec: number }; b?: undefined; t?: undefined; i?: undefined };

/** Scena miasta (Nowy Tomyśl, Leszno, dzielnica Poznania) jako napis SVG. */
export function drawScene(S: Scene, o: SceneDrawOptions = {}): { g: string; bb: BB } {
  const mini = !!o.mini;
  const airport = o.hideAirport ? null : S.airport;
  const srcs = o.hideSources ? [] : S.srcs;
  const masts = o.hideSources ? [] : S.masts;
  const startLabel = o.hideStart ? null : S.startLabel;
  const bb: BB = [1e9, 1e9, -1e9, -1e9];
  const pp = (x: number, y: number, z = 0): XY => {
    const p = P(x, y, z);
    if (p[0] < bb[0]) bb[0] = p[0]; if (p[1] < bb[1]) bb[1] = p[1]; if (p[0] > bb[2]) bb[2] = p[0]; if (p[1] > bb[3]) bb[3] = p[1];
    return p;
  };
  const poly = (pts: XY[], a: string) => `<polygon points="${pts.map(p => f(p[0]) + ',' + f(p[1])).join(' ')}" ${a}/>`;
  const quad = (x: number, y: number, w: number, d: number, z: number, a: string, fn = pp) =>
    poly([fn(x, y, z), fn(x + w, y, z), fn(x + w, y + d, z), fn(x, y + d, z)], a);
  const line = (a: XY, b: XY, st: string) => `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" ${st}/>`;

  let g = quad(0, 0, S.W, S.H, 0, sty(V('map-ground')));
  S.cells.forEach(c => g += quad(c.x, c.y, c.w, c.h, 0, mini ? sty(V('map-cell-edge')) : sty(V('map-cell'), V('map-cell-edge'))));
  S.streets.forEach(s => {
    const a = s.from ?? 0, b = s.to ?? (s.v ? S.H : S.W);
    const fl = mini ? (s.main ? V('map-mini-street-main') : V('map-mini-street')) : V('map-street');
    g += s.v ? quad(s.c - s.w / 2, a, s.w, b - a, 0, sty(fl)) : quad(a, s.c - s.w / 2, b - a, s.w, 0, sty(fl));
    if (mini) return;
    if (s.dual) {
      const cross = S.streets.filter(o2 => o2.v !== s.v && o2.from == null).map(o2 => [o2.c - o2.w / 2 - 2, o2.c + o2.w / 2 + 2]).sort((x, y) => x[0] - y[0]);
      const segs: XY[] = []; let p0 = a;
      cross.forEach(([u, v]) => { if (u > p0) segs.push([p0, u]); p0 = Math.max(p0, v); });
      if (p0 < b) segs.push([p0, b]);
      segs.forEach(([u, v]) => {
        const green = sty(V('map-green'), V('map-green-edge'));
        g += s.v ? quad(s.c - 4, u, 8, v - u, 0, green) : quad(u, s.c - 4, v - u, 8, 0, green);
        [-1, 1].forEach(sd => {
          const off = s.c + sd * (4 + (s.w / 2 - 4) / 2);
          g += line(s.v ? P(off, u) : P(u, off), s.v ? P(off, v) : P(v, off), `${sty(undefined, V('map-lane'))} stroke-dasharray="7 7" stroke-width=".9"`);
        });
      });
    } else if (s.main) g += line(s.v ? P(s.c, a) : P(a, s.c), s.v ? P(s.c, b) : P(b, s.c), `${sty(undefined, V('map-lane'))} stroke-dasharray="8 8"`);
  });
  S.grounds.forEach(q => {
    if (mini && !['park', 'pitch', 'square'].includes(q.kind)) return;
    g += quad(q.x, q.y, q.w, q.d, 0, GSTYLE[q.kind] || GSTYLE.paved);
    if (mini) return;
    if (q.kind === 'pitch') {
      const hz = q.w >= q.d;
      g += line(hz ? P(q.x + q.w / 2, q.y) : P(q.x, q.y + q.d / 2), hz ? P(q.x + q.w / 2, q.y + q.d) : P(q.x + q.w, q.y + q.d / 2), sty(undefined, V('map-g-pitch-edge')));
      const cc = P(q.x + q.w / 2, q.y + q.d / 2);
      g += `<ellipse cx="${f(cc[0])}" cy="${f(cc[1])}" rx="${Math.min(q.w, q.d) * .2}" ry="${Math.min(q.w, q.d) * .1}" ${sty('none', V('map-g-pitch-edge'))}/>`;
    }
    if (q.kind === 'park' && q.cross) {
      g += line(P(q.x, q.y), P(q.x + q.w, q.y + q.d), `${sty(undefined, V('edge'))} stroke-width="3"`)
        + line(P(q.x + q.w, q.y), P(q.x, q.y + q.d), `${sty(undefined, V('edge'))} stroke-width="3"`);
      const e = P(q.x + q.w / 2, q.y + q.d / 2);
      g += `<ellipse cx="${f(e[0])}" cy="${f(e[1])}" rx="16" ry="8" ${sty(V('panel'), V('acc'))} stroke-opacity=".6"/>`;
    }
    if (q.kind === 'square') { for (let x = q.x + 12; x < q.x + q.w; x += 12) g += line(P(x, q.y + 4), P(x, q.y + q.d - 4), `${sty(undefined, V('map-g-square-line'))} stroke-width=".6"`); }
    if (q.kind === 'play') { const cc = P(q.x + q.w / 2, q.y + q.d / 2); g += `<circle cx="${f(cc[0])}" cy="${f(cc[1])}" r="2.5" ${sty(V('coin'))} fill-opacity=".6"/>`; }
  });
  if (mini && airport) {
    const a = P(airport.x, airport.y);
    g += `<circle cx="${f(a[0])}" cy="${f(a[1])}" r="70" ${sty(V('bg'), V('acc'))} stroke-width="12"/><text x="${f(a[0])}" y="${f(a[1] + 34)}" text-anchor="middle" font-size="100" ${sty(V('acc'))}>✈</text>`;
  }
  if (mini) {
    if (S.home) { const h = P(S.home.x, S.home.y); g += `<circle cx="${f(h[0])}" cy="${f(h[1])}" r="14" ${sty(V('acc'))}/>`; }
    return { g, bb };
  }
  S.crossings.forEach(([x, y, a, b]) => {
    for (let k = 0; k < 4; k++) {
      g += quad(x - a / 2 + 3 + k * (a - 6) / 4, y + b / 2 + 2, 2.5, 7, 0, sty(V('map-crossing')));
      g += quad(x + a / 2 + 2, y - b / 2 + 3 + k * (b - 6) / 4, 7, 2.5, 0, sty(V('map-crossing')));
    }
  });
  const circs = masts.map(m => { const pts: XY[] = []; for (let i = 0; i < 90; i++) { const t = i / 90 * Math.PI * 2; pts.push(P(m.x + Math.cos(t) * m.r, m.y + Math.sin(t) * m.r)); } return pts; });
  circs.forEach(c => g += poly(c, `${sty(V('acc'))} fill-opacity=".025"`));
  srcs.forEach(b => g += quad(b.range.x, b.range.y, b.range.w, b.range.h, 0, `${sty(V('coin'))} fill-opacity=".05"`, P));
  let top = '';
  const items: Item[] = [];
  S.boxes.forEach((b, i) => items.push({ k: P(b.x + b.w / 2, b.y + b.d / 2)[1] + (b.z0 ? .01 : 0), b, i }));
  S.cars.forEach(c => items.push({ k: P(c.x + c.w / 2, c.y + c.d / 2)[1], b: { ...c, kind: 'car' } }));
  srcs.forEach(s => items.push({ k: P(s.x, s.y)[1], b: { ...s, kind: 'src' } }));
  S.trees.forEach(t => items.push({ k: P(t.x, t.y)[1], t }));
  masts.forEach(m => items.push({ k: P(m.x, m.y)[1] + .02, m }));
  items.sort((a, b) => a.k - b.k);
  items.forEach(it => {
    if (it.t) {
      const a = pp(it.t.x, it.t.y), b = pp(it.t.x, it.t.y, 11);
      g += line(a, b, `${sty(undefined, V('map-trunk'))} stroke-width="1.5"`) + `<ellipse cx="${f(b[0])}" cy="${f(b[1] - 2)}" rx="7" ry="4" ${sty(V('map-tree'), V('map-tree-edge'))}/>`;
      return;
    }
    if (it.m) {
      const m = it.m, [x, y] = pp(m.x, m.y, 0), [x2, y2] = pp(m.x, m.y, 90);
      g += `<path d="M${f(x - 6)} ${f(y)}L${f(x2)} ${f(y2)}L${f(x + 6)} ${f(y)}M${f(x - 4)} ${f((y + y2) / 2 + 10)}h8M${f(x - 2)} ${f((y + y2) / 2 - 12)}h4" ${sty('none', V('acc'))} stroke-width="1.4"/><circle cx="${f(x2)}" cy="${f(y2)}" r="3" ${sty(V('acc'))}/>`;
      top += `<text x="${f(x2 + 7)}" y="${f(y2 + 4)}" font-size="11" ${sty(V('acc'), HALO)} paint-order="stroke" stroke-width="3">${m.k} ${sec(m.sec)}</text>`;
      return;
    }
    const b = it.b!;
    if (b.kind === 'car') { g += quad(b.x, b.y, b.w, b.d, b.h, `${sty(V(`map-car-${b.col}`), HALO)} stroke-width=".6"`); return; }
    const c = b.home ? HOME : (PAL[b.kind] || PAL.old), z0 = b.z0 || 0, z1 = z0 + b.h;
    let h = '';
    const sides: [XY, XY, string][] = [[[b.x, b.y + b.d], [b.x + b.w, b.y + b.d], c.w1], [[b.x + b.w, b.y + b.d], [b.x + b.w, b.y], c.w2]];
    sides.forEach(([A, B, fill]) => {
      h += poly([pp(A[0], A[1], z0), pp(B[0], B[1], z0), pp(B[0], B[1], z1), pp(A[0], A[1], z1)], `${sty(fill, c.st)} stroke-width=".7"`);
      if (!c.win || b.h < 7) return;
      const len = Math.hypot(B[0] - A[0], B[1] - A[1]); let d = '';
      if (c.bands) {
        for (let z = z0 + FLOOR - 1; z < z1 - 2; z += FLOOR) { const a = P(A[0], A[1], z), e = P(B[0], B[1], z); d += `M${f(a[0])} ${f(a[1])}L${f(e[0])} ${f(e[1])}`; }
        h += `<path d="${d}" ${sty(undefined, c.win)} stroke-opacity=".3" stroke-width="1.1"/>`;
        return;
      }
      for (let z = z0 + 5; z < z1 - 2; z += 7) for (let t = 5; t < len - 4; t += 7) { const q = P(A[0] + (B[0] - A[0]) * t / len, A[1] + (B[1] - A[1]) * t / len, z); d += `M${f(q[0])} ${f(q[1])}h1.6`; }
      if (d) h += `<path d="${d}" ${sty(undefined, c.win)} stroke-opacity=".55" stroke-width="1.6"/>`;
    });
    if (b.kind === 'house') {
      const ax = b.w >= b.d, rh = z1 + 6, rk = b.home ? 'home' : 'house';
      const f1 = V(`map-${rk}-roof-1`), f2 = V(`map-${rk}-roof-2`), f3 = V(`map-${rk}-roof-3`);
      const s = (fill: string) => `${sty(fill, c.st)} stroke-width=".7"`;
      if (ax) {
        const r1 = P(b.x, b.y + b.d / 2, rh), r2 = P(b.x + b.w, b.y + b.d / 2, rh);
        h += poly([pp(b.x, b.y, z1), pp(b.x + b.w, b.y, z1), r2, r1], s(f1)) + poly([pp(b.x + b.w, b.y + b.d, z1), pp(b.x + b.w, b.y, z1), r2], s(f2)) + poly([pp(b.x, b.y + b.d, z1), pp(b.x + b.w, b.y + b.d, z1), r2, r1], s(f3));
      } else {
        const r1 = P(b.x + b.w / 2, b.y, rh), r2 = P(b.x + b.w / 2, b.y + b.d, rh);
        h += poly([pp(b.x, b.y, z1), pp(b.x, b.y + b.d, z1), r2, r1], s(f1)) + poly([pp(b.x, b.y + b.d, z1), pp(b.x + b.w, b.y + b.d, z1), r2], s(f3)) + poly([pp(b.x + b.w, b.y, z1), pp(b.x + b.w, b.y + b.d, z1), r2, r1], s(f2));
      }
    } else if (b.kind === 'hip') {
      const ins = Math.min(b.w, b.d) / 2, rh = z1 + 7, ax = b.w >= b.d;
      const r1 = ax ? P(b.x + ins, b.y + b.d / 2, rh) : P(b.x + b.w / 2, b.y + ins, rh), r2 = ax ? P(b.x + b.w - ins, b.y + b.d / 2, rh) : P(b.x + b.w / 2, b.y + b.d - ins, rh);
      const A = pp(b.x, b.y, z1), B = pp(b.x + b.w, b.y, z1), C = pp(b.x + b.w, b.y + b.d, z1), D = pp(b.x, b.y + b.d, z1);
      const s = (fill: string) => `${sty(fill, V('map-hip-st'))} stroke-width=".7"`;
      h += poly(ax ? [A, B, r2, r1] : [A, D, r2, r1], s(V('map-hip-roof-1'))) + poly(ax ? [B, C, r2] : [B, C, r2, r1], s(V('map-hip-roof-2'))) + poly(ax ? [D, C, r2, r1] : [D, C, r2], s(V('map-hip-roof-3')));
    } else {
      h += quad(b.x, b.y, b.w, b.d, z1, `${sty(c.roof, c.st)} stroke-width=".8"`);
      if (b.kind === 'tower') {
        const e = P(b.x + b.w / 2, b.y + b.d / 2, z1);
        h += `<ellipse cx="${f(e[0])}" cy="${f(e[1])}" rx="${b.w * .3}" ry="${b.w * .15}" ${sty('none', V('map-tower-st'))} stroke-width=".8"/><text x="${f(e[0])}" y="${f(e[1] + 3)}" text-anchor="middle" font-size="8" ${sty(V('map-tower-st'))}>H</text>`;
      }
    }
    const cls = ['b']; if (b.h >= 60) cls.push('tall');
    g += it.i != null && !['roofbit', 'antenna'].includes(b.kind)
      ? `<g class="${cls.join(' ')}" data-i="${it.i}">${h}</g>`
      : `<g class="${b.h >= 60 || b.kind === 'antenna' ? 'b tall' : ''}">${h}</g>`;
    const tl = P(b.x + b.w / 2, b.y + b.d / 2, z1 + (b.kind === 'house' ? 6 : 0));
    if (b.home) top += `<text x="${f(tl[0])}" y="${f(tl[1] - 8)}" text-anchor="middle" font-size="12" font-weight="700" ${sty(V('acc'), HALO)} paint-order="stroke" stroke-width="3">⌂ DOM</text>`;
    else if (b.label) top += `<text x="${f(tl[0])}" y="${f(tl[1] + 4)}" text-anchor="middle" font-size="${b.kind === 'market' ? 12 : 10}" font-weight="${b.kind === 'market' ? 700 : 400}" ${sty(b.kind === 'market' ? V('coin') : V('text'), HALO)} paint-order="stroke" stroke-width="3">${b.label}</text>`;
    if (b.kind === 'src') { const t = P(b.x + b.w, b.y, z1); top += `<text x="${f(t[0] + 5)}" y="${f(t[1])}" font-size="11" ${sty(V('coin'), HALO)} paint-order="stroke" stroke-width="3">${b.k} ${sec(b.sec!)}</text>`; }
  });
  g += top;
  circs.forEach(c => g += poly(c, `${sty('none', V('acc-dim'))} stroke-dasharray="5 5"`));
  srcs.forEach(b => g += quad(b.range.x, b.range.y, b.range.w, b.range.h, 0, `${sty('none', V('coin'))} stroke-opacity=".75" ${b.sec > 2 ? '' : 'stroke-dasharray="3 4"'}`, P));
  const ang = (v: number) => { const a = P(0, 0), b = v ? P(0, 1) : P(1, 0); let r = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI; if (r > 90) r -= 180; if (r < -90) r += 180; return r; };
  S.streets.forEach(s => {
    const a = s.from ?? 0, b = s.to ?? (s.v ? S.H : S.W); const len = b - a; const n = Math.max(1, Math.round(len / 380));
    for (let k = 0; k < n; k++) {
      const t = a + len * (k + .5) / n; const p = s.v ? P(s.c, t) : P(t, s.c);
      g += `<text transform="translate(${f(p[0])},${f(p[1])}) rotate(${ang(s.v)})" text-anchor="middle" dy="3.5" font-size="${s.main ? 11 : s.short ? 8 : 9.5}" ${sty(V('map-label'), V('track'))} paint-order="stroke" stroke-width="3">${s.n}</text>`;
    }
  });
  // [decyzja] drogowskaz lotniska: lotnisko niedostępne w demo, bez kursora „kliknij”.
  if (airport) {
    const p = P(airport.x, airport.y);
    g += `<g class="exit"><path d="M${f(p[0])} ${f(p[1])}v-34" ${sty(undefined, V('acc'))} stroke-width="1.5"/><rect x="${f(p[0] - 6)}" y="${f(p[1] - 62)}" width="340" height="28" rx="4" ${sty(V('panel'), V('acc'))}/><text x="${f(p[0] + 4)}" y="${f(p[1] - 43)}" font-size="12" font-weight="700" ${sty(V('acc'))}>✈ Lotnisko Poznań-Warta · niedostępne w demo</text></g>`;
  }
  if (startLabel) {
    const sp = P(S.start.x, S.start.y);
    g += `<circle cx="${f(sp[0])}" cy="${f(sp[1])}" r="6" ${sty(V('text'))}/><text x="${f(sp[0] - 10)}" y="${f(sp[1] + 20)}" font-size="10" ${sty(V('text'))}>${startLabel}</text>`;
  }
  return { g, bb };
}

type Quad4 = [string, string, string, string];
const boxPal = (k: string): Quad4 => [V(`map-${k}-roof`), V(`map-${k}-w1`), V(`map-${k}-w2`), V(`map-${k}-st`)];
// CITYPAL (linia 493): old/modern/tower/slab jak PAL, „house” to dach kopertowy (PAL.hip), plus dworzec.
const CITYPAL: Record<string, Quad4> = {
  old: boxPal('old'), modern: boxPal('modern'), tower: boxPal('tower'), slab: boxPal('slab'), house: boxPal('hip'), station: boxPal('station'),
};

function boxSvg(b: { x: number; y: number; w: number; d: number; h: number }, c: Quad4, pp: (x: number, y: number, z?: number) => XY): string {
  const z1 = b.h, poly = (pts: XY[], a: string) => `<polygon points="${pts.map(p => f(p[0]) + ',' + f(p[1])).join(' ')}" ${a}/>`;
  return poly([pp(b.x, b.y + b.d), pp(b.x + b.w, b.y + b.d), pp(b.x + b.w, b.y + b.d, z1), pp(b.x, b.y + b.d, z1)], `${sty(c[1], c[3])} stroke-width="1.5"`)
    + poly([pp(b.x + b.w, b.y + b.d), pp(b.x + b.w, b.y), pp(b.x + b.w, b.y, z1), pp(b.x + b.w, b.y + b.d, z1)], `${sty(c[2], c[3])} stroke-width="1.5"`)
    + poly([pp(b.x, b.y, z1), pp(b.x + b.w, b.y, z1), pp(b.x + b.w, b.y + b.d, z1), pp(b.x, b.y + b.d, z1)], `${sty(c[0], c[3])} stroke-width="1.5"`);
}

/** Cały Poznań z dzielnicami jako napis SVG. Każda dzielnica w <g class="dist" data-d="…">. */
export function drawCity(C: CityView, o: { mini?: boolean } = {}): { g: string; bb: BB } {
  const mini = !!o.mini;
  let bb: BB = [1e9, 1e9, -1e9, -1e9];
  const pp = (x: number, y: number, z = 0): XY => { const p = P(x, y, z); bb = [Math.min(bb[0], p[0]), Math.min(bb[1], p[1]), Math.max(bb[2], p[0]), Math.max(bb[3], p[1])]; return p; };
  const poly = (pts: XY[], a: string) => `<polygon points="${pts.map(p => f(p[0]) + ',' + f(p[1])).join(' ')}" ${a}/>`;
  const quad = (x: number, y: number, w: number, d: number, z: number, a: string) => poly([pp(x, y, z), pp(x + w, y, z), pp(x + w, y + d, z), pp(x, y + d, z)], a);
  const line = (a: XY, b: XY, st: string) => `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" ${st}/>`;
  const { W, H, V: VL, Hs } = C;
  // granice komórek do środka ulic
  const sx = (i: number): XY => [i > 0 ? VL[i - 1].c : 0, i < VL.length ? VL[i].c : W];
  const sy = (j: number): XY => [j > 0 ? Hs[j - 1].c : 0, j < Hs.length ? Hs[j].c : H];
  let g = quad(-300, -300, W + 600, H + 600, 0, sty(V('map-outside')));
  // pola za miastem (wylosowane w generatorze)
  if (!mini) C.fields.forEach(q => g += quad(q.x, q.y, q.w, q.d, 0, `${sty(V('map-field'), V('map-field-edge'))} stroke-width="2"`));
  DKEYS.forEach((k, n) => {
    let s = '';
    C.cells.forEach(c => { if (c.d !== k) return; const [x0, x1] = sx(c.i), [y0, y1] = sy(c.j); s += quad(x0, y0, x1 - x0, y1 - y0, 0, sty(V(`map-${mini ? 'mini-' : ''}dist-${n}`))); });
    g += `<g class="dist" data-d="${k}">${s}</g>`;
  });
  if (mini) {
    C.cells.filter(c => c.water).forEach(c => { const [x0, x1] = sx(c.i), [y0, y1] = sy(c.j); g += quad(x0, y0, x1 - x0, y1 - y0, 0, sty(V('map-mini-water'))); });
    g += quad(C.AIR.x, C.AIR.y, C.AIR.w, C.AIR.h, 0, sty(V('map-mini-airport')));
    return { g, bb };
  }
  // ulice: pełne tylko w mieście, główne wychodzą za miasto
  const inCity = (x: number, y: number) => (((x - W * .5) / (W * .53)) ** 2 + ((y - H * .5) / (H * .55)) ** 2) < 1.08;
  VL.forEach(s => { if (s.main) g += quad(s.c - s.w / 2, -300, s.w, H + 600, 0, sty(V('map-street-main'))); else C.ys.forEach(([y0, y1]) => { if (inCity(s.c, (y0 + y1) / 2)) g += quad(s.c - s.w / 2, y0 - 8, s.w, y1 - y0 + 16, 0, sty(V('map-street'))); }); });
  Hs.forEach(s => { if (s.main) g += quad(-300, s.c - s.w / 2, W + 600, s.w, 0, sty(V('map-street-main'))); else C.xs.forEach(([x0, x1]) => { if (inCity((x0 + x1) / 2, s.c)) g += quad(x0 - 8, s.c - s.w / 2, x1 - x0 + 16, s.w, 0, sty(V('map-street'))); }); });
  // parki (drzewa wylosowane w generatorze, po 5 na park)
  let ti = 0;
  C.cells.filter(c => c.park && c.d).forEach(c => {
    g += quad(c.x, c.y, c.w, c.h, 0, `${sty(V('map-green'), V('map-green-edge'))} stroke-width="2"`);
    for (let k = 0; k < 5; k++) { const t = C.parkTrees[ti++]; const p = P(t.x, t.y); g += `<ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="12" ry="7" ${sty(V('map-tree'))}/>`; }
  });
  // rzeka
  const rw = 95;
  for (let i = 0; i < C.river.length - 1; i++) { const [ax, ay] = C.river[i], [bx, by] = C.river[i + 1]; g += poly([pp(ax - rw, ay), pp(bx - rw, by), pp(bx + rw, by), pp(ax + rw, ay)], sty(V('map-water'), V('map-water'))); }
  for (let i = 0; i < C.river.length - 1; i++) { const [ax, ay] = C.river[i], [bx, by] = C.river[i + 1]; [-rw, rw].forEach(o2 => g += line(P(ax + o2, ay), P(bx + o2, by), `${sty(undefined, V('map-river'))} stroke-width="2.5"`)); }
  // mosty: główne ulice poziome i kolej
  const rx = (y: number) => C.river.reduce((m, p) => Math.abs(p[1] - y) < Math.abs(m[1] - y) ? p : m)[0];
  const bridge = `${sty(V('map-bridge'), V('map-bridge-edge'))} stroke-width="2"`;
  Hs.filter(s => s.main).forEach(s => { const x = rx(s.c); g += quad(x - rw - 30, s.c - s.w / 2, 2 * rw + 60, s.w, 2, bridge); });
  // kolej
  {
    const y = C.rail; const x = rx(y); g += quad(x - rw - 30, y - 12, 2 * rw + 60, 24, 2, bridge);
    [-5, 5].forEach(o2 => g += line(P(-300, y + o2), P(W + 300, y + o2), `${sty(undefined, V('map-rail'))} stroke-width="2.5"`));
    let d = ''; for (let x2 = -300; x2 < W + 300; x2 += 30) { const a = P(x2, y - 9), b = P(x2, y + 9); d += `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`; }
    g += `<path d="${d}" ${sty(undefined, V('map-rail-tie'))} stroke-width="2"/>`;
  }
  // lotnisko
  {
    const A = C.AIR;
    g += `<g class="exit">` + quad(A.x, A.y, A.w, A.h, 0, `${sty(V('map-airport-ground'), V('coin'))} stroke-opacity=".6" stroke-dasharray="14 10" stroke-width="3"`)
      + quad(A.x + 40, A.y + 120, A.w - 80, 40, 0, `${sty(V('map-airport-runway'), V('text'))} stroke-width="2"`)
      + quad(A.x + 200, A.y + 200, 420, 150, 0, `${sty(V('map-airport-apron'), V('map-airport-apron-edge'))} stroke-width="2"`);
    let d = ''; for (let x = A.x + 70; x < A.x + A.w - 70; x += 50) { const a = P(x, A.y + 140), b = P(x + 25, A.y + 140); d += `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`; }
    g += `<path d="${d}" ${sty(undefined, V('text'))} stroke-width="3"/>`;
    const tb = { x: A.x + 230, y: A.y + 370, w: 300, d: 70, h: 16 };
    g += boxSvg(tb, boxPal('airport'), pp) + `</g>`;
  }
  // zabudowa (sortowanie głębokości)
  const all = C.boxes.map(b => ({ ...b, pal: b.kind })).concat([{ ...C.dworzec, kind: 'station', dk: 'centrum' as const, pal: 'station' }]);
  all.sort((a, b) => P(a.x + a.w / 2, a.y + a.d / 2)[1] - P(b.x + b.w / 2, b.y + b.d / 2)[1]);
  all.forEach(b => g += boxSvg(b, CITYPAL[b.pal] || CITYPAL.old, pp));
  // granice dzielnic
  const cellAt: Record<string, (typeof C.cells)[number]> = {};
  C.cells.forEach(c => cellAt[c.i + ',' + c.j] = c);
  let bd = '', bo = '';
  C.cells.forEach(c => {
    const r = cellAt[(c.i + 1) + ',' + c.j], dn = cellAt[c.i + ',' + (c.j + 1)];
    if (r && (c.d || r.d) && c.d !== r.d && !c.water && !r.water) { const x = VL[c.i].c, [y0, y1] = sy(c.j); const a = P(x, y0), b = P(x, y1); const s = `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`; if (c.d && r.d) bd += s; else bo += s; }
    if (dn && (c.d || dn.d) && c.d !== dn.d && !c.water && !dn.water) { const y = Hs[c.j].c, [x0, x1] = sx(c.i); const a = P(x0, y), b = P(x1, y); const s = `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`; if (c.d && dn.d) bd += s; else bo += s; }
  });
  g += `<path d="${bo}" ${sty('none', V('map-border-out'))} stroke-width="3"/><path class="bord" d="${bd}" ${sty('none', V('acc'))} stroke-opacity=".7" stroke-width="5" stroke-dasharray="22 14"/>`;
  // napisy
  const txt = (x: number, y: number, t: string, sz: number, fill: string, w = 700, z = 0) => {
    const p = P(x, y, z);
    return `<text x="${f(p[0])}" y="${f(p[1])}" text-anchor="middle" font-size="${sz}" font-weight="${w}" ${sty(fill, HALO)} paint-order="stroke" stroke-width="${sz / 5}" pointer-events="none">${t}</text>`;
  };
  DKEYS.forEach(k => { const D = C.dists[k], I = DISTRICT_META[k]; g += txt(D.cx, D.cy, I.name.toUpperCase(), 100, V('text'), 700, 70) + txt(D.cx, D.cy, I.tag, 50, V('map-label'), 400, 10); });
  // [decyzja] lotnisko niedostępne w demo
  { const A = C.AIR; g += txt(A.x + A.w / 2, A.y + A.h / 2, '✈ PORT LOTNICZY', 50, V('acc'), 700, 80) + txt(A.x + A.w / 2, A.y + A.h / 2, 'Poznań-Warta · niedostępne w demo', 34, V('acc'), 400, 30); }
  { const D = C.dworzec; g += txt(D.x + D.w / 2, D.y + D.d / 2, 'DWORZEC GŁÓWNY', 38, V('text'), 700, D.h + 30); }
  { const y = H * .2, x = rx(y); const p = P(x, y); g += `<text transform="translate(${f(p[0])},${f(p[1])}) rotate(-30)" text-anchor="middle" font-size="46" font-style="italic" ${sty(V('blue'), HALO)} paint-order="stroke" stroke-width="8">Warta</text>`; }
  return { g, bb };
}
