// Czas rzeczywisty zlecenia L.: straż oceny okna (i w Task 5 minuty na żywo).
import type { RealtimeSource } from '../../engine/realtime';
import { m3Check } from './window';

/** Ocena okna także po poleceniach z innych tabel (scan, probe) i po tiku 's1'. */
export const M3_WATCH_SOURCE: RealtimeSource = {
  id: 'm3-watch',
  active: (s) => s.screen === 'desktop' && s.overlay === null && s.active === 'm3',
  tick: (s) => m3Check(s),
};
