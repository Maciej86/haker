// Pokaz przejścia trasą na planie piętra (misja.html linie 1768–1772), jako czysta funkcja czasu.
import type { WalkSpec } from './types';
import type { PlanDot } from './missions';

/** Klatka po `elapsed` ms: kropka idzie łamaną do `stopAt` (0..1) przez `ms`, stoi `holdMs`, potem znika. */
export function walkFrame(w: WalkSpec, elapsed: number): { dot: PlanDot | null; done: boolean } {
  if (elapsed >= w.ms * w.stopAt + w.holdMs) return { dot: null, done: true };
  const pts = w.path;
  const lens: number[] = [];
  let tot = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    lens.push(d);
    tot += d;
  }
  const k = Math.max(0, Math.min(w.stopAt, elapsed / w.ms));
  const seen = w.stopAt < 1 && k >= w.stopAt;
  if (!lens.length) return { dot: { x: pts[0][0], y: pts[0][1], seen }, done: false };
  let d = k * tot, i = 0;
  while (i < lens.length - 1 && d > lens[i]) { d -= lens[i]; i++; }
  const a = pts[i], b = pts[i + 1], f = lens[i] ? Math.min(1, d / lens[i]) : 0;
  return { dot: { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, seen }, done: false };
}
