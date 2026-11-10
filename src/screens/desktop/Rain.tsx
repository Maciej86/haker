import { useEffect, useRef } from 'react';
import { usePref } from '../../ui/prefs';
import { FIRST_WAVE, makeDrops, nextWave, stepDrop, type Drop } from './rain';

// misja.html linie 1657–1669
export function Rain() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [pref] = usePref('neonos-rain', 'on');
  const on = pref !== 'off';
  const ctl = useRef({ on, level: on ? 1 : 0, target: 1 as 0 | 1, next: FIRST_WAVE });

  useEffect(() => {
    const c = ctl.current;
    if (on && !c.on) { c.target = 1; c.next = FIRST_WAVE; }
    c.on = on;
  }, [on]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (typeof matchMedia !== 'function' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let x: CanvasRenderingContext2D | null = null;
    try { x = canvas.getContext('2d'); } catch { x = null; }
    if (!x) return;
    const ctx = x;
    let drops: Drop[] = [];
    const size = () => {
      canvas.width = innerWidth;
      canvas.height = innerHeight;
      drops = makeDrops(canvas.width, canvas.height, Math.random);
    };
    size();
    addEventListener('resize', size);
    const timer = setInterval(() => {
      const c = ctl.current;
      if (--c.next > 0) return;
      const w = nextWave(c.target, Math.random);
      c.target = w.target;
      c.next = w.next;
    }, 1000);
    let raf = 0;
    const frame = () => {
      const c = ctl.current;
      c.level += ((c.on ? c.target : 0) - c.level) * 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (c.level > 0.01) {
        const n = Math.floor(drops.length * c.level);
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--rain');
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const d = drops[i];
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - 1.5, d.y + d.l);
          drops[i] = stepDrop(d, canvas.height, canvas.width, Math.random);
        }
        ctx.stroke();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(timer);
      removeEventListener('resize', size);
    };
  }, []);

  return <canvas id="rain" ref={ref} aria-hidden="true" />;
}
