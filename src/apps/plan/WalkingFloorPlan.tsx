import { useEffect, useSyncExternalStore } from 'react';
import { step } from '../../engine/types';
import { useStore } from '../../ui/useGame';
import { FloorPlanApp } from './FloorPlan';
import { walk } from './walk';

/** Slot pulpitu: łapie zdarzenie `walk` także wtedy, gdy okno planu jest jeszcze zamknięte.
 * Po przejściu wysyła zdarzenia `after` (toast, przyrost) zwykłą drogą Store, bez zmiany stanu. */
export function PlanWalkListener() {
  const store = useStore();
  useEffect(() => store.onUi((e) => {
    if (e.kind !== 'walk') return;
    const after = e.after ?? [];
    walk.start(e, after.length ? () => store.apply(step(store.get(), [], after)) : undefined);
  }), [store]);
  return null;
}

/** Okno „Plan piętra” z kropką pokazu przejścia (plan 31). */
export function WalkingFloorPlan() {
  const dot = useSyncExternalStore(walk.subscribe, walk.get);
  return <FloorPlanApp dot={dot} />;
}
