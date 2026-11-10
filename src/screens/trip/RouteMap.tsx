// Mapa trasy ze znacznikiem „TY” (wyjazd.tpl.html 215–243): okolice Nowego Tomyśla i Poznania albo scena miasta.
// Na scenie Centrum nie ma znacznika celu (drawScene zawsze w trybie gry).
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Geo } from '../../world/geo/load';
import { pj } from '../../world/geo/project';
import { REGION_VIEWBOX, drawRegion } from '../../world/geo/render';
import { P, drawScene } from '../../world/city/render';
import type { Scene } from '../../world/city/types';

export type RouteKind = 'pl' | 'nt' | 'pz';
type Props = {
  kind: RouteKind; pts: [number, number][]; progress: number;
  geo: Geo; nt: Scene; pz: Scene; mode: 'train' | 'car';
};

const f = (v: number) => v.toFixed(1);

export function RouteMap({ kind, pts, progress, geo, nt, pz, mode }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const move = useRef<((t: number) => void) | null>(null);
  const prog = useRef(progress);
  prog.current = progress;
  const [size, setSize] = useState(0);
  useEffect(() => {
    const on = () => setSize((n) => n + 1);
    addEventListener('resize', on);
    return () => removeEventListener('resize', on);
  }, []);

  useLayoutEffect(() => {
    const svg = ref.current!;
    move.current = null;
    let g: string | ((sc: number) => string);
    let vb: [number, number, number, number];
    let P2: [number, number][];
    if (kind === 'pl') {
      g = (sc) => drawRegion(geo, mode, sc);
      vb = REGION_VIEWBOX;
      P2 = pts.map((p) => pj(p[0], p[1]));
    } else {
      const m = kind === 'nt'
        ? drawScene(nt, { hideStart: true, hideAirport: true, hideSources: true })
        : drawScene(pz, { hideStart: true, hideAirport: true });
      P2 = pts.map((p) => P(p[0], p[1]));
      const xs = P2.map((p) => p[0]), ys = P2.map((p) => p[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const w = Math.max(x1 - x0 + 260, 520), h = Math.max(y1 - y0 + 220, 360);
      vb = [(x0 + x1) / 2 - w / 2, (y0 + y1) / 2 - h / 2, w, h];
      g = m.g;
    }
    const r = svg.getBoundingClientRect();
    if (!r.width || !r.height) { svg.innerHTML = ''; return; } // bez rozmiaru (jsdom)
    // dopasuj proporcje viewBox do okna
    const ar = r.width / r.height, [x, y, w, h] = vb;
    let W2 = w, H2 = h;
    if (w / h < ar) W2 = h * ar; else H2 = w / ar;
    svg.setAttribute('viewBox', `${x - (W2 - w) / 2} ${y - (H2 - h) / 2} ${W2} ${H2}`);
    const pd = 'M' + P2.map((p) => f(p[0]) + ' ' + f(p[1])).join('L');
    const sc = W2 / r.width, sw = 3 * sc;
    svg.innerHTML = (typeof g === 'function' ? g(sc) : g)
      + `<path d="${pd}" fill="none" style="stroke:var(--bg)" stroke-width="${sw * 2.4}" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<path d="${pd}" fill="none" style="stroke:var(--acc)" stroke-opacity=".45" stroke-width="${sw}" stroke-dasharray="${sw * 3} ${sw * 2}"/>`
      + `<path class="done" d="${pd}" fill="none" style="stroke:var(--acc)" stroke-width="${sw * 1.4}" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<g class="mk"><circle r="${14 * sc}" style="fill:var(--acc)" fill-opacity=".18"><animate attributeName="r" values="${10 * sc};${20 * sc};${10 * sc}" dur="1.4s" repeatCount="indefinite"/></circle>`
      + `<circle r="${6 * sc}" style="fill:var(--acc);stroke:var(--trip-on-acc)" stroke-width="${1.5 * sc}"/>`
      + `<text y="${-12 * sc}" text-anchor="middle" font-size="${11 * sc}" font-weight="700" style="fill:var(--acc);stroke:var(--trip-on-acc)" paint-order="stroke" stroke-width="${3 * sc}">TY</text></g>`;
    const done = svg.querySelector<SVGPathElement>('.done')!, mk = svg.querySelector('.mk')!;
    if (typeof done.getTotalLength !== 'function') return;
    const L = done.getTotalLength();
    done.style.strokeDasharray = `${L} ${L}`;
    move.current = (t) => {
      const p = done.getPointAtLength(L * t);
      mk.setAttribute('transform', `translate(${p.x} ${p.y})`);
      done.style.strokeDashoffset = String(L * (1 - t));
    };
    move.current(prog.current);
  }, [kind, pts, geo, nt, pz, mode, size]);

  useLayoutEffect(() => { move.current?.(progress); }, [progress]);

  return <svg ref={ref} className="m" />;
}
