// Magazyn kropki na planie piętra: klatki co 40 ms z Date.now() (setTimeout zamiast requestAnimationFrame,
// żeby testy szły na vi.useFakeTimers()). Nowy start przerywa poprzedni.
import type { PlanDot } from '../../engine/missions';
import type { WalkSpec } from '../../engine/types';
import { walkFrame } from '../../engine/walk';

let dot: PlanDot | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
const subs = new Set<() => void>();

function set(d: PlanDot | null): void {
  dot = d;
  subs.forEach((fn) => fn());
}

export const walk = {
  get(): PlanDot | null {
    return dot;
  },
  subscribe(fn: () => void): () => void {
    subs.add(fn);
    return () => { subs.delete(fn); };
  },
  start(w: WalkSpec): void {
    if (timer !== null) clearTimeout(timer);
    const t0 = Date.now();
    const frame = () => {
      const f = walkFrame(w, Date.now() - t0);
      set(f.dot);
      timer = f.done ? null : setTimeout(frame, 40);
    };
    frame();
  },
};
