// Magazyn kropki na planie piętra: klatki co 40 ms z Date.now() (setTimeout zamiast requestAnimationFrame,
// żeby testy szły na vi.useFakeTimers()). Nowy start przerywa poprzedni (bez `onDone`), `clear` też.
import type { PlanDot } from '../../engine/missions';
import type { WalkSpec } from '../../engine/types';
import { walkDuration, walkFrame } from '../../engine/walk';

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
  /** `onDone` po ostatniej klatce: wynik okna widać dopiero po przejściu (misja.html linia 1723). */
  start(w: WalkSpec, onDone?: () => void): void {
    if (timer !== null) clearTimeout(timer);
    const t0 = Date.now();
    const frame = () => {
      const elapsed = Date.now() - t0;
      const f = walkFrame(w, elapsed);
      set(f.dot);
      // ostatnia klatka dokładnie na końcu pokazu: razem z liniami (termHold) i mailem
      timer = f.done ? null : setTimeout(frame, Math.max(1, Math.min(40, walkDuration(w) - elapsed)));
      if (f.done) onDone?.();
    };
    frame();
  },
  /** Nowa gra: przerywa pokaz bez `onDone`. */
  clear(): void {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    set(null);
  },
};
