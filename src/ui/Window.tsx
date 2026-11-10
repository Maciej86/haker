import { useEffect, useRef, type ReactNode } from 'react';
import type { AppId } from '../engine/types';
import { useWindows } from './windows';
import './Window.css';

export type WindowProps = {
  app: AppId;
  label: string;
  title: string;
  icon: string;
  tone?: 'red';
  minW?: number;
  minH?: number;
  children?: ReactNode;
};

export function Window({ app, label, title, icon, tone, minW = 320, minH = 180, children }: WindowProps) {
  const w = useWindows();
  const r = w.rect(app);
  const ref = useRef<HTMLElement>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const rectRef = useRef(r);
  rectRef.current = r;

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      const cur = rectRef.current;
      if (Math.abs(el.offsetWidth - cur.w) >= 1 || Math.abs(el.offsetHeight - cur.h) >= 1) {
        w.resize(app, el.offsetWidth, el.offsetHeight);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [app, w]);

  return (
    <section
      ref={ref}
      className={`win open${w.isActive(app) ? ' active' : ''}`}
      aria-label={label}
      style={{ left: r.x, top: r.y, width: r.w, height: r.h, minWidth: minW, minHeight: minH, zIndex: w.zIndex(app) }}
      onPointerDown={() => w.focus(app)}
    >
      <div
        className="titlebar"
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          const cur = rectRef.current;
          drag.current = { dx: e.clientX - cur.x, dy: e.clientY - cur.y };
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (d) w.move(app, e.clientX - d.dx, e.clientY - d.dy);
        }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke={tone === 'red' ? 'var(--red)' : 'currentColor'} strokeWidth="1.8"
          dangerouslySetInnerHTML={{ __html: icon }} />
        <span className="t">{title}</span>
        <button aria-label="Zamknij" onClick={(e) => { e.stopPropagation(); w.close(app); }}>✕</button>
      </div>
      <div className="body">{children}</div>
    </section>
  );
}
