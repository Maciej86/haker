// Przeciąganie przedmiotu z plecaka na cel w szafce (port `dragTo`, wyjazd.tpl.html 327–334).
// Kafelek gotowy do użycia pulsuje (`ready`), cel ma klasę `want`, nad celem (margines 14 px) `over`.
// Upuszczenie poza celem albo złego przedmiotu potrząsa podpowiedzią i nic nie zmienia.
// [decyzja] Przedmiot upuszczony na cel chwilę przed końcem poprzedniego kroku (gdy nic jeszcze nie czeka)
// liczy się, kiedy krok z tym przedmiotem się zacznie.
import { useCallback, useRef, useState, type PointerEvent as RPointerEvent } from 'react';

export type ItemKey = 'key' | 'dev' | 'phone';
type Armed = { item: ItemKey; target: () => Element | null; done: () => void };
type Pt = { clientX: number; clientY: number };

export type DragTo = {
  arm(item: ItemKey, target: () => Element | null, hint: string): Promise<void>;
  armed: { item: ItemKey; hint: string } | null;
  ghost: { item: ItemKey; x: number; y: number } | null;
  lift: ItemKey | null;
  used: ItemKey[];
  shake: number;
  onPointerDown(item: ItemKey): (e: RPointerEvent) => void;
};

const MARGIN = 14;
const inside = (el: Element | null, p: Pt): boolean => {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return p.clientX > r.left - MARGIN && p.clientX < r.right + MARGIN && p.clientY > r.top - MARGIN && p.clientY < r.bottom + MARGIN;
};

export function useDragTo(): DragTo {
  const ref = useRef<Armed | null>(null);
  const pending = useRef<{ item: ItemKey; p: Pt } | null>(null);
  const usedRef = useRef<ItemKey[]>([]);
  const [armed, setArmed] = useState<DragTo['armed']>(null);
  const [ghost, setGhost] = useState<DragTo['ghost']>(null);
  const [lift, setLift] = useState<ItemKey | null>(null);
  const [used, setUsed] = useState<ItemKey[]>([]);
  const [shake, setShake] = useState(0);

  const finish = useCallback((a: Armed, tgt: Element | null) => {
    tgt?.classList.remove('want', 'over');
    ref.current = null;
    setArmed(null);
    if (a.item === 'dev') { usedRef.current = [...usedRef.current, 'dev']; setUsed(usedRef.current); }
    a.done();
  }, []);

  const arm = useCallback((item: ItemKey, target: () => Element | null, hint: string) => new Promise<void>((done) => {
    const a: Armed = { item, target, done };
    const early = pending.current;
    pending.current = null;
    if (early && early.item === item && inside(target(), early.p)) { finish(a, target()); return; }
    ref.current = a;
    target()?.classList.add('want');
    setShake(0);
    setArmed({ item, hint });
  }), [finish]);

  const onPointerDown = useCallback((item: ItemKey) => (e: RPointerEvent) => {
    if (usedRef.current.includes(item)) return;
    e.preventDefault();
    setLift(item);
    let last: Pt = e;
    const live = () => (ref.current && ref.current.item === item ? ref.current : null);
    const move = (ev: Pt) => {
      last = { clientX: ev.clientX, clientY: ev.clientY };
      setGhost({ item, x: ev.clientX - 60, y: ev.clientY - 20 });
      const a = ref.current, tgt = a?.target() ?? null;
      tgt?.classList.toggle('over', !!live() && inside(tgt, last));
    };
    const up = () => {
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
      setGhost(null); setLift(null);
      const a = ref.current, tgt = a?.target() ?? null;
      tgt?.classList.remove('over');
      if (!a) { pending.current = { item, p: last }; return; }
      if (a.item === item && inside(tgt, last)) finish(a, tgt);
      else setShake((n) => n + 1);
    };
    move(e);
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
  }, [finish]);

  return { arm, armed, ghost, lift, used, shake, onPointerDown };
}
