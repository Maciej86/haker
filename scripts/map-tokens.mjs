// Tokeny kolorów map i wyjazdu (npm run gen:map-tokens → src/theme/map-tokens.css).
// Wartości Fosfora to heksy z makiet: mapa-miasta.html (renderer 301–402, drawCity 493–549),
// _src/mapa-polski.tpl.html i _src/wyjazd.tpl.html. Kolor równy tokenowi bazowemu
// (--acc, --coin, --red, --text, --dim, --bg, --panel, --edge, --track, --blue…) w kodzie
// zostaje tokenem bazowym; tu są tylko kolory map. Inne motywy: color-mix z bazą (zob. mixFor).
import { writeFileSync } from 'node:fs';

const T = {
  // ---- budynki: PAL (mapa-miasta.html 303–316) + HOME (318) ----
  'map-old-roof': '#14303a', 'map-old-w1': '#0b1a1f', 'map-old-w2': '#0e232a', 'map-old-st': '#2a5c5c', 'map-old-win': '#3f7d76',
  'map-modern-roof': '#1c3c44', 'map-modern-w1': '#0f262c', 'map-modern-w2': '#133038', 'map-modern-st': '#4f8f88', 'map-modern-win': '#7fc8bc',
  'map-tower-roof': '#1f4048', 'map-tower-w1': '#0f262c', 'map-tower-w2': '#14323a', 'map-tower-st': '#6fb5aa', 'map-tower-win': '#9fe0d4',
  'map-podium-roof': '#16303a', 'map-podium-w1': '#0d2026', 'map-podium-w2': '#10282e', 'map-podium-st': '#3a7470', 'map-podium-win': '#5aa69a',
  'map-antenna-roof': '#34f0b0', 'map-antenna-w1': '#1b7d64', 'map-antenna-w2': '#1b7d64', 'map-antenna-st': '#34f0b0',
  'map-slab-roof': '#18353c', 'map-slab-w1': '#0d2126', 'map-slab-w2': '#112a30', 'map-slab-st': '#3a7470', 'map-slab-win': '#5aa69a',
  'map-school-roof': '#2a3a2c', 'map-school-w1': '#172219', 'map-school-w2': '#1c2a1e', 'map-school-st': '#6e9a6a', 'map-school-win': '#a8d29a',
  'map-market-roof': '#1d3236', 'map-market-w1': '#122326', 'map-market-w2': '#16292d', 'map-market-st': '#5a8a86',
  'map-house-roof': '#1a2f33', 'map-house-w1': '#0c1a1e', 'map-house-w2': '#102428', 'map-house-st': '#2a5254', 'map-house-win': '#3f7d76',
  'map-hip-roof': '#2a2024', 'map-hip-w1': '#140f12', 'map-hip-w2': '#1a1418', 'map-hip-st': '#7a5a5e', 'map-hip-win': '#a07a80',
  'map-place-roof': '#1a3a40', 'map-place-w1': '#0f2328', 'map-place-w2': '#122b31', 'map-place-st': '#8fb3ad', 'map-place-win': '#a9d4cc',
  'map-shed-roof': '#122a30', 'map-shed-w1': '#0b181c', 'map-shed-w2': '#0d2025', 'map-shed-st': '#1f4648',
  'map-roofbit-roof': '#18383f', 'map-roofbit-w1': '#0e2024', 'map-roofbit-w2': '#10272c', 'map-roofbit-st': '#2a5c5c',
  'map-src-roof': '#f4b942', 'map-src-w1': '#8a6420', 'map-src-w2': '#a87a28', 'map-src-st': '#f4b942',
  'map-home-roof': '#1b7d64', 'map-home-w1': '#0f3a2e', 'map-home-w2': '#14503f', 'map-home-st': '#34f0b0', 'map-home-win': '#34f0b0',
  // dachy dwuspadowe (house) i kopertowe (hip), linie 376–381
  'map-house-roof-1': '#24444a', 'map-house-roof-2': '#16302f', 'map-house-roof-3': '#1f3a3f',
  'map-home-roof-1': '#2fd39c', 'map-home-roof-2': '#1b7d64', 'map-home-roof-3': '#25a87e',
  'map-hip-roof-1': '#4a2a30', 'map-hip-roof-2': '#3a2026', 'map-hip-roof-3': '#55323a',
  // dworzec na mapie Poznania (CITYPAL.station, 493)
  'map-station-roof': '#2a3a40', 'map-station-w1': '#14262c', 'map-station-w2': '#1a2e34', 'map-station-st': '#cfe8e1',
  // ---- grunty GSTYLE (319–321) ----
  'map-g-paved': '#11222a', 'map-g-paved-edge': '#1d4446',
  'map-g-lot': '#0f1f24', 'map-g-lot-edge': '#1d4446',
  'map-g-garden': '#0f231d', 'map-g-garden-edge': '#1f4a3c',
  'map-g-pitch': '#123a2a', 'map-g-pitch-edge': '#4fae8e',
  'map-g-park': '#0f2622', 'map-g-park-edge': '#1b5446',
  'map-g-play': '#1a2a22', 'map-g-play-edge': '#4f8a6a',
  'map-g-square': '#15282c', 'map-g-square-edge': '#2a5c5c', 'map-g-square-line': '#1d3a3e',
  'map-g-plaza': '#122429', 'map-g-plaza-edge': '#1d4446',
  // ---- reszta renderera scen i miasta ----
  'map-ground': '#0c171c', 'map-cell': '#0d1b20', 'map-cell-edge': '#16353a',
  'map-street': '#132a2e', 'map-street-main': '#1a3a3e', 'map-mini-street': '#1d4446', 'map-mini-street-main': '#2a6a5e',
  'map-lane': '#3a6a68', 'map-crossing': '#2a5254', 'map-label': '#8fb3ad',
  'map-green': '#0f2622', 'map-green-edge': '#1b5446',
  'map-tree': '#123a30', 'map-tree-edge': '#1b7d64', 'map-trunk': '#1d4446',
  'map-water': '#0f2a3a', 'map-river': '#3d7ea6', 'map-mini-water': '#1a4a6a',
  'map-bridge': '#1f4448', 'map-bridge-edge': '#8fb3ad', 'map-rail': '#8fb3ad', 'map-rail-tie': '#5a8a86',
  'map-outside': '#0a1512', 'map-field': '#0d1a14', 'map-field-edge': '#14261e', 'map-border-out': '#2a5c5c',
  'map-dist-0': '#0f2026', 'map-dist-1': '#0d1c21', 'map-dist-2': '#11232a', 'map-dist-3': '#0e1e20',
  'map-dist-4': '#102126', 'map-dist-5': '#0d1b1f', 'map-dist-6': '#12242a',
  'map-mini-dist-0': '#16353a', 'map-mini-dist-1': '#1d4446', 'map-mini-dist-2': '#14303a', 'map-mini-dist-3': '#1a3e3f',
  'map-mini-dist-4': '#183a3c', 'map-mini-dist-5': '#12302f', 'map-mini-dist-6': '#1f4648',
  'map-car-0': '#3a5a5e', 'map-car-1': '#5e4a3a', 'map-car-2': '#2f4650', 'map-car-3': '#6b2b36', 'map-car-4': '#4a5a3a', 'map-car-5': '#55606a',
  'map-airport-ground': '#0c1a16', 'map-airport-runway': '#17262a', 'map-airport-apron': '#11222a', 'map-airport-apron-edge': '#24484a',
  'map-airport-roof': '#16323a', 'map-airport-w1': '#0e252b', 'map-airport-w2': '#123039', 'map-airport-st': '#6fb5aa',
  'map-mini-airport': '#2a3a3e',
  // pasek aplikacji i karty map (mapa-miasta CSS 8–65, mapa-polski CSS 8–69)
  'map-bar': '#08131a', 'map-btn-edge': '#2a5c5c', 'map-on-acc': '#04130d', 'map-clock-edge': '#3a3420', 'map-tab-off': '#3d5552',
  'map-mis-edge': '#4a1f28', 'map-dist-hover': '#17423f',
  // ---- mapa Polski (mapa-polski.tpl.html 147–212, wyjazd.tpl.html 215–228) ----
  'geo-sea': '#08131a', 'geo-sea-line': '#10283a', 'geo-sea-label': '#3d7ea6',
  'geo-foreign': '#0c171b', 'geo-foreign-edge': '#22393c',
  'geo-land': '#0e1f24', 'geo-land-edge': '#34f0b0',
  'geo-voi': '#1f4446', 'geo-voi-label': '#2f5f5c', 'geo-country-label': '#3a5a5c',
  'geo-river': '#3d7ea6', 'geo-river-label': '#5fa8d3',
  'geo-road-a': '#f4b942', 'geo-road-s': '#c49a3a', 'geo-road-a-bg': '#3a2c10', 'geo-road-s-bg': '#2a2410', 'geo-road-casing': '#0a1116',
  'geo-rail': '#cfe8e1', 'geo-label': '#8fb3ad', 'geo-town': '#6d8c87',
  'geo-locked': '#0e1f24', 'geo-dot-hover': '#ffffff',
  // ---- wyjazd (wyjazd.tpl.html CSS 8–120, oś czasu 249–259, szafka 307–324, rozmowa 359–405) ----
  'trip-desk': '#070d11', 'trip-desk-glow': '#0f2228', 'trip-win': '#0a1418', 'trip-win-edge': '#2a5c5c', 'trip-shadow': '#000000',
  'trip-title': '#0c1a1f', 'trip-clock-edge': '#3a3420', 'trip-tgt-edge': '#4a1f28', 'trip-opt-hover': '#2a6a5e',
  'trip-row': '#16353a', 'trip-on-acc': '#04130d', 'trip-on-red': '#1a0508', 'trip-log-line': '#0f2328', 'trip-map': '#08131a',
  'trip-pb': '#13262c', 'trip-phone': '#050b0e',
  'trip-tl-wait': '#2a5c5c', 'trip-tl-back': '#3a6a8a', 'trip-tl-cur': '#ffffff',
  'trip-wall': '#122a2e', 'trip-wall-top': '#0d1b20', 'trip-floor': '#0f2024',
  'trip-cab': '#16292d', 'trip-cab-edge': '#5a8a86', 'trip-cab-row': '#0f1c20', 'trip-cab-row-edge': '#3a5a5e',
  'trip-port': '#08131a', 'trip-port-edge': '#2a4a50', 'trip-led-off': '#1b7d64',
  'trip-dev': '#1b2e2a', 'trip-cab-door': '#1f3438', 'trip-cab-door-edge': '#8fb3ad', 'trip-label': '#8fb3ad',
  'trip-bubble': '#14262c', 'trip-bubble-bad': '#2a1016', 'trip-bubble-ok': '#0f2a26', 'trip-avatar': '#2a4a50',
};

// Wartości bazowe Fosfora (src/theme/tokens.css).
const BG = '#0a1116';
const BASE = { text: '#cfe8e1', red: '#ff5d73', coin: '#f4b942', blue: '#5fa8d3', acc: '#34f0b0' };

const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
function hsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60; if (h < 0) h += 360;
  return [h, s, l];
}
// Baza po barwie: szarości → --text, 330–20° → --red, 20–70° → --coin, 190–250° → --blue, reszta → --acc.
function baseFor(hex) {
  const [h, s] = hsl(rgb(hex));
  if (s < 0.15) return 'text';
  if (h >= 330 || h < 20) return 'red';
  if (h < 70) return 'coin';
  if (h >= 190 && h < 250) return 'blue';
  return 'acc';
}
// Udział bazy: rzut koloru na odcinek tło→baza w RGB.
function mixFor(hex) {
  const B = baseFor(hex), c = rgb(hex), bg = rgb(BG), b = rgb(BASE[B]);
  const v = b.map((x, i) => x - bg[i]), u = c.map((x, i) => x - bg[i]);
  const t = u.reduce((s, x, i) => s + x * v[i], 0) / v.reduce((s, x) => s + x * x, 0);
  const P = Math.round(100 * Math.min(1, Math.max(0, t)));
  return `color-mix(in srgb, var(--${B}) ${P}%, var(--bg))`;
}

const decl = f => Object.entries(T).map(([k, v]) => `  --${k}: ${f(v)};`).join('\n');
const themed = Object.entries(T).map(([k, v]) => `  --${k}: ${mixFor(v)};`).join('\n');
const out = `/* Wygenerowane przez scripts/map-tokens.mjs (npm run gen:map-tokens). Nie edytuj ręcznie. */
:root{
${decl(v => v)}
}
${['neon', 'bursztyn', 'halo'].map(t => `:root[data-theme="${t}"]{\n${themed}\n}`).join('\n')}
`;
writeFileSync(new URL('../src/theme/map-tokens.css', import.meta.url), out);
console.log(`map-tokens.css: ${Object.keys(T).length} tokenów`);
