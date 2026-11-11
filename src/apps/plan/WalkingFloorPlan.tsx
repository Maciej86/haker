import { useEffect, useSyncExternalStore } from 'react';
import { useStore } from '../../ui/useGame';
import { FloorPlanApp } from './FloorPlan';
import { walk } from './walk';

/** Slot pulpitu: łapie zdarzenie `walk` także wtedy, gdy okno planu jest jeszcze zamknięte. */
export function PlanWalkListener() {
  const store = useStore();
  useEffect(() => store.onUi((e) => {
    if (e.kind === 'walk') walk.start({ path: e.path, stopAt: e.stopAt, ms: e.ms, holdMs: e.holdMs });
  }), [store]);
  return null;
}

/** Okno „Plan piętra” z kropką pokazu przejścia (plan 31). */
export function WalkingFloorPlan() {
  const dot = useSyncExternalStore(walk.subscribe, walk.get);
  return <FloorPlanApp dot={dot} />;
}
