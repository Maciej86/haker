// Przesuwanie i przybliżanie SVG: port apply/zoomAt/drag/wheel z mapa-miasta.html (572–577, 591–608)
// i mapa-polski.tpl.html (182–185, 218–226). viewBox ustawiany wprost na elemencie, bez rerenderu Reacta.
import { useEffect, useMemo, useRef, type RefObject } from 'react';

export type ViewRect = { x: number; y: number; w: number; h: number };
export type View = { cx: number; cy: number; zoom: number };
type Num = number | (() => number);

export type PanZoomOpts = {
  full: () => ViewRect;
  zmin: Num;
  zmax: Num;
  home: () => View;
  /** 'view' (mapa miasta): krawędź widoku najwyżej 200 j. za planem; 'center' (mapa Polski): środek widoku. */
  clamp?: 'view' | 'center';
  /** Po każdym ustawieniu widoku (LOD, minimapa). */
  onApply?: (v: View, vb: ViewRect) => void;
};

export type PanZoom = {
  zoomAt(f: number, px: number, py: number): void;
  home(): void;
  center(cx: number, cy: number): void;
  set(v: Partial<View>): void;
  apply(): void;
  moved: () => boolean;
  dragging: () => boolean;
  view: View;
};

const num = (n: Num) => (typeof n === 'function' ? n() : n);

export function usePanZoom(svgRef: RefObject<SVGSVGElement | null>, opts: PanZoomOpts): PanZoom {
  const o = useRef(opts);
  o.current = opts;
  const st = useRef({ view: { cx: 0, cy: 0, zoom: 1 } as View, drag: null as null | { x: number; y: number; cx: number; cy: number }, moved: false });

  const api = useMemo<PanZoom>(() => {
    const apply = () => {
      const svg = svgRef.current;
      if (!svg) return;
      const r = svg.getBoundingClientRect();
      if (!r.width || !r.height) return; // jeszcze bez rozmiaru (np. jsdom)
      const v = st.current.view, F = o.current.full();
      const vw = r.width / v.zoom, vh = r.height / v.zoom;
      if (o.current.clamp === 'center') {
        v.cx = Math.max(F.x - 200, Math.min(F.x + F.w + 200, v.cx));
        v.cy = Math.max(F.y - 200, Math.min(F.y + F.h + 200, v.cy));
      } else {
        v.cx = Math.max(F.x + vw / 2 - 200, Math.min(F.x + F.w - vw / 2 + 200, v.cx));
        v.cy = Math.max(F.y + vh / 2 - 200, Math.min(F.y + F.h - vh / 2 + 200, v.cy));
      }
      const vb = { x: v.cx - vw / 2, y: v.cy - vh / 2, w: vw, h: vh };
      svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
      o.current.onApply?.(v, vb);
    };
    const zoomAt = (f: number, px: number, py: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const r = svg.getBoundingClientRect(), v = st.current.view;
      const nz = Math.max(num(o.current.zmin), Math.min(num(o.current.zmax), v.zoom * f));
      const wx = v.cx + (px - r.width / 2) / v.zoom, wy = v.cy + (py - r.height / 2) / v.zoom;
      v.cx = wx - (px - r.width / 2) / nz; v.cy = wy - (py - r.height / 2) / nz; v.zoom = nz;
      apply();
    };
    return {
      apply,
      zoomAt,
      home() { Object.assign(st.current.view, o.current.home()); apply(); },
      center(cx, cy) { Object.assign(st.current.view, { cx, cy }); apply(); },
      set(p) { Object.assign(st.current.view, p); apply(); },
      moved: () => st.current.moved,
      dragging: () => st.current.drag !== null,
      get view() { return st.current.view; },
    };
  }, [svgRef]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const s = st.current;
    const down = (e: PointerEvent) => {
      s.drag = { x: e.clientX, y: e.clientY, cx: s.view.cx, cy: s.view.cy };
      s.moved = false;
      try { svg.setPointerCapture(e.pointerId); } catch { /* zdarzenie syntetyczne */ }
      svg.classList.add('drag');
    };
    const move = (e: PointerEvent) => {
      const d = s.drag;
      if (!d) return;
      if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 3) s.moved = true;
      s.view.cx = d.cx - (e.clientX - d.x) / s.view.zoom;
      s.view.cy = d.cy - (e.clientY - d.y) / s.view.zoom;
      api.apply();
    };
    const up = () => { s.drag = null; svg.classList.remove('drag'); };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = svg.getBoundingClientRect();
      api.zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top);
    };
    const resize = () => api.apply();
    svg.addEventListener('pointerdown', down);
    svg.addEventListener('pointermove', move);
    svg.addEventListener('pointerup', up);
    svg.addEventListener('pointercancel', up);
    svg.addEventListener('wheel', wheel, { passive: false });
    addEventListener('resize', resize);
    return () => {
      svg.removeEventListener('pointerdown', down);
      svg.removeEventListener('pointermove', move);
      svg.removeEventListener('pointerup', up);
      svg.removeEventListener('pointercancel', up);
      svg.removeEventListener('wheel', wheel);
      removeEventListener('resize', resize);
    };
  }, [svgRef, api]);

  return api;
}
