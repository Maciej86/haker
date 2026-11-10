// Rysowanie map: Polska (mapa-polski.tpl.html, `draw()`) i okolice Nowego Tomyśla (wyjazd.tpl.html, `G(sc)`).
// Kolory przez tokeny CSS (--geo-*, --trip-*), w atrybucie style.
import type { Geo } from './load';
import { pj } from './project';
import { AIRPORTS, CITIES, CITY_TAB, HOME_CITY, LPOS, ROADS, isOpen } from './cities';

const NS = 'vector-effect="non-scaling-stroke"';
const f = (v: number): string => v.toFixed(1);
const v = (name: string): string => `var(--${name})`;
const sty = (o: Record<string, string>): string =>
  `style="${Object.entries(o).map(([k, val]) => `${k}:${val}`).join(';')}"`;

export const RAILPTS: [number, number][] = [[16.13, 52.32], [16.41, 52.31], [16.52, 52.36], [16.75, 52.40], [16.93, 52.40]];
export const CARPTS: [number, number][] = [[16.13, 52.32], [16.2, 52.30], [16.52, 52.33], [16.79, 52.36], [16.93, 52.41]];

export function drawPoland(geo: Geo, o: { missionCity: string | null }): string {
  const at = (x: number, y: number, cls: string, inner: string, extra = '') =>
    `<g class="${cls}" transform="translate(${f(x)} ${f(y)})"${extra}><g class="sc">${inner}</g></g>`;
  const home = CITIES.find((c) => c.n === HOME_CITY)!;
  let g = `<defs><pattern id="sea" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" ${sty({ fill: v('geo-sea') })}/><path d="M0 10L10 0" ${sty({ stroke: v('geo-sea-line') })} stroke-width=".6"/></pattern></defs>`;
  g += `<rect x="-400" y="-300" width="1800" height="1400" fill="url(#sea)"/>`;
  Object.entries(geo.countries).forEach(([k, d]) => {
    if (k !== 'POL') g += `<path d="${d}" ${sty({ fill: v('geo-foreign'), stroke: v('geo-foreign-edge') })} stroke-width="1" ${NS}/>`;
  });
  g += `<path d="${geo.countries.POL}" ${sty({ fill: v('geo-land'), stroke: 'none' })}/>`;
  g += `<g class="voi">` + geo.voi.map((w) => `<path d="${w.d}" fill="none" ${sty({ stroke: v('geo-voi') })} stroke-width="1" stroke-dasharray="4 3" ${NS}/>`).join('')
    + geo.voi.map((w) => at(w.c[0], w.c[1], 'lbl', `<text text-anchor="middle" font-size="9" ${sty({ fill: v('geo-voi-label') })} letter-spacing=".08em">${w.n.toUpperCase()}</text>`)).join('') + `</g>`;
  g += geo.rivers.map((r) => `<path d="${r.d}" fill="none" ${sty({ stroke: v('geo-river') })} stroke-opacity=".75" stroke-width="${r.n === 'Wisła' || r.n === 'Odra' ? 1.8 : 1.2}" ${NS}/>`).join('');
  g += `<path d="${geo.countries.POL}" fill="none" ${sty({ stroke: v('geo-land-edge') })} stroke-opacity=".75" stroke-width="1.8" ${NS}/>`;
  const names: [string, number, number][] = [['NIEMCY', 13.0, 52.6], ['CZECHY', 15.6, 49.9], ['SŁOWACJA', 19.6, 48.85], ['UKRAINA', 24.6, 50.2], ['BIAŁORUŚ', 24.6, 52.9], ['LITWA', 23.9, 54.9], ['ROSJA', 21.0, 54.85], ['MORZE BAŁTYCKIE', 16.8, 55.1]];
  names.forEach(([n, lo, la]) => {
    const [x, y] = pj(lo, la);
    const sea = n.startsWith('MORZE');
    g += at(x, y, 'lbl', `<text text-anchor="middle" font-size="${sea ? 13 : 11}" ${sty({ fill: v(sea ? 'geo-sea-label' : 'geo-country-label') })} letter-spacing=".15em">${n}</text>`);
  });
  const rn: [string, number, number, number][] = [['Wisła', 19.35, 52.95, -35], ['Odra', 14.75, 52.75, 80], ['Warta', 17.9, 52.14, -5], ['Bug', 23.15, 52.3, -55]];
  rn.forEach(([n, lo, la, r]) => {
    const [x, y] = pj(lo, la);
    g += at(x, y, 'lbl', `<text transform="rotate(${r})" font-size="9" font-style="italic" ${sty({ fill: v('geo-river-label') })}>${n}</text>`);
  });
  g += `<g class="roads">` + ROADS.map(([n, pts]) => {
    const P = pts.map((p) => pj(p[0], p[1]));
    const A = n[0] === 'A';
    const d = 'M' + P.map((p) => f(p[0]) + ' ' + f(p[1])).join('L');
    const m = P[Math.floor(P.length / 2)];
    return `<path d="${d}" fill="none" ${sty({ stroke: v('geo-road-casing') })} stroke-width="${A ? 4 : 3.2}" ${NS}/><path d="${d}" fill="none" ${sty({ stroke: v(A ? 'geo-road-a' : 'geo-road-s') })} stroke-opacity=".75" stroke-width="${A ? 2.2 : 1.4}" ${A ? '' : 'stroke-dasharray="6 4"'} ${NS}/>`
      + at(m[0], m[1], 'lbl', `<rect x="4" y="-13" width="${n.length * 7 + 6}" height="12" rx="2" ${sty({ fill: v(A ? 'geo-road-a-bg' : 'geo-road-s-bg'), stroke: v('geo-road-a') })} stroke-width=".6"/><text x="7" y="-4" font-size="9" ${sty({ fill: v('geo-road-a') })}>${n}</text>`);
  }).join('') + `</g>`;
  // lotniska: wszystkie w kolorze --blue (lotnisko Poznań też jest niedostępne w demo)
  g += `<g class="air">` + AIRPORTS.map(([lo, la], i) => {
    const [x, y] = pj(lo, la);
    return at(x, y, 'city', `<circle r="6" ${sty({ fill: v('bg'), stroke: v('blue') })}/><text y="3.5" text-anchor="middle" font-size="9" ${sty({ fill: v('blue') })}>✈</text>`, ` data-a="${i}"`);
  }).join('') + `</g>`;
  const mc = o.missionCity ? CITIES.find((c) => c.n === o.missionCity) : undefined;
  if (mc) {
    const a = pj(home.lo, home.la), b = pj(mc.lo, mc.la);
    g += `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" ${sty({ stroke: v('red') })} stroke-width="1.6" stroke-dasharray="5 4" fill="none" ${NS}/>`;
  }
  CITIES.slice().sort((a, b) => a.pop - b.pop).forEach((c) => {
    const i = CITIES.indexOf(c);
    const [x, y] = pj(c.lo, c.la);
    const open = isOpen(c.n), isHome = c.n === HOME_CITY, mis = !!mc && c.n === mc.n;
    const r = c.tier === 'big' ? 5.5 : c.tier === 'medium' ? 3.6 : 2.6;
    const col = isHome ? v('acc') : mis ? v('red') : open ? v('text') : v('geo-town');
    const lod = (c.tier === 'small' && !isHome && !CITY_TAB[c.n]) ? ' lod' : !open && c.tier === 'medium' && c.pop < 90 ? ' lod' : '';
    const fs = c.tier === 'big' ? 12 : c.tier === 'medium' ? 10 : 9.5;
    let s = '';
    if (isHome || mis) s += `<circle r="10" fill="none" ${sty({ stroke: col })} stroke-opacity=".5"><animate attributeName="r" values="7;15;7" dur="2.4s" repeatCount="indefinite"/><animate attributeName="stroke-opacity" values=".7;0;.7" dur="2.4s" repeatCount="indefinite"/></circle>`;
    s += c.tier === 'big'
      ? `<rect class="dot" x="${-r}" y="${-r}" width="${2 * r}" height="${2 * r}" ${sty({ fill: open ? col : v('geo-land'), stroke: col })} fill-opacity="${open ? 0.9 : 1}" stroke-width="1.2"/>`
      : `<circle class="dot" r="${r}" ${sty({ fill: open ? col : v('geo-land'), stroke: col })} stroke-width="1"/>`;
    const pos = LPOS[c.n] || (['Gdynia', 'Sopot'].includes(c.n) ? 'l' : 'r');
    const lbl = (isHome ? '⌂ ' : '') + c.n + (open ? '' : ' 🔒') + (mis ? ' ◎' : '');
    const ta = pos === 'b' ? `x="0" y="${r + 11}" text-anchor="middle"` : pos === 't' ? `x="0" y="${-r - 5}" text-anchor="middle"`
      : pos === 'l' ? `x="${-r - 4}" y="3.5" text-anchor="end"` : `x="${r + 4}" y="3.5" text-anchor="start"`;
    s += `<text ${ta} font-size="${fs}" font-weight="${c.tier === 'big' || isHome || mis ? 700 : 400}" ${sty({ fill: col, stroke: v('geo-sea') })} paint-order="stroke" stroke-width="3">${lbl}</text>`;
    g += at(x, y, 'city' + lod, s, ` data-i="${i}"`);
  });
  return g;
}

const A = pj(15.8, 52.58), B = pj(17.2, 52.08);
export const REGION_VIEWBOX: [number, number, number, number] = [A[0] - 6, A[1] - 6, B[0] - A[0] + 12, B[1] - A[1] + 12];

/** Okolice Nowego Tomyśla i Poznania (mapa przejazdu). `sc` skaluje napisy i kropki. */
export function drawRegion(geo: Geo, kind: 'train' | 'car', sc: number): string {
  let g = `<rect x="0" y="0" width="900" height="800" ${sty({ fill: v('trip-map') })}/>`;
  g += `<path d="${geo.countries.POL}" ${sty({ fill: v('geo-land'), stroke: v('geo-land-edge') })} stroke-opacity=".5" stroke-width="1" ${NS}/>`;
  const wlkp = geo.voi.find((w) => w.n === 'wielkopolskie')!;
  g += `<path d="${wlkp.d}" fill="none" ${sty({ stroke: v('geo-voi') })} stroke-dasharray="4 3" ${NS}/>`;
  g += geo.rivers.map((r) => `<path d="${r.d}" fill="none" ${sty({ stroke: v('geo-river') })} stroke-opacity=".7" stroke-width="1.4" ${NS}/>`).join('');
  const a2 = ([[15.3, 52.27], [15.53, 52.25], [16.13, 52.32], [16.93, 52.41], [17.4, 52.35]] as [number, number][]).map((p) => pj(p[0], p[1]));
  g += `<path d="M${a2.map((p) => p.join(' ')).join('L')}" ${sty({ stroke: v('geo-road-a') })} stroke-opacity=".55" stroke-width="2.2" fill="none" ${NS}/>`;
  const r3 = ([[15.6, 52.24], [15.92, 52.25], ...RAILPTS, [17.3, 52.45]] as [number, number][]).map((p) => pj(p[0], p[1]));
  const r3d = `M${r3.map((p) => p.join(' ')).join('L')}`;
  g += `<path d="${r3d}" ${sty({ stroke: v('geo-rail') })} stroke-opacity=".5" stroke-width="2.4" fill="none" ${NS}/><path d="${r3d}" ${sty({ stroke: v('geo-sea') })} stroke-width="1.2" stroke-dasharray="4 4" fill="none" ${NS}/>`;
  const lbl = (lo: number, la: number, t: string, c: string, fs = 11, anc: 'start' | 'end' | 'middle' = 'start', dy = 0) => {
    const [x, y] = pj(lo, la);
    const dx = anc === 'start' ? 7 * sc : anc === 'end' ? -7 * sc : 0;
    return `<circle cx="${x}" cy="${y}" r="${3.5 * sc}" ${sty({ fill: c })}/><text x="${x + dx}" y="${y + (4 + dy) * sc}" text-anchor="${anc}" font-size="${fs * sc}" ${sty({ fill: c, stroke: v('geo-sea') })} paint-order="stroke" stroke-width="${3 * sc}">${t}</text>`;
  };
  const acc = v('acc'), red = v('red'), town = v('geo-town');
  g += lbl(16.13, 52.32, '⌂ Nowy Tomyśl', acc, 13, 'end') + lbl(16.93, 52.41, 'Poznań ◎', red, 14) + lbl(16.41, 52.31, 'Opalenica', town, 11, 'middle', 14)
    + lbl(16.52, 52.36, 'Buk', town, 11, 'middle', -14) + lbl(16.37, 52.23, 'Grodzisk Wlkp.', town) + lbl(15.92, 52.25, 'Zbąszyń', town) + lbl(16.12, 52.12, 'Wolsztyn', town);
  const [x, y] = pj(16.35, 52.5);
  g += `<text x="${x}" y="${y}" font-size="${11 * sc}" ${sty({ fill: v('geo-label') })}>${kind === 'car' ? 'autostrada A2' : 'linia kolejowa nr 3, Berlin – Poznań – Warszawa'}</text>`;
  return g;
}
