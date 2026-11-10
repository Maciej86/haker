import { useEffect, useMemo, useSyncExternalStore } from 'react';
import type { Store } from '../engine/store';
import { createRealtimeLoop, realtimeSpeed } from '../engine/realtime';

export function useRealtime(store: Store): { paused: boolean; resume: () => void } {
  const loop = useMemo(
    () => createRealtimeLoop(store, {
      speed: realtimeSpeed(typeof location === 'undefined' ? '' : location.search),
      isHidden: () => typeof document !== 'undefined' && document.hidden,
    }),
    [store],
  );

  useEffect(() => {
    const id = setInterval(() => loop.tick(1000), 1000);
    const onVis = () => loop.setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [loop]);

  const paused = useSyncExternalStore(loop.subscribe, loop.paused);
  return { paused, resume: loop.resume };
}
