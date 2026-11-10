// Skoki deweloperskie map i wyjazdu (?dev=1). Import w src/missions/index.ts (nie w engine/dev.ts: cykl importów).
import { registerDevJump } from '../../engine/dev';
import { newGame } from '../../engine/state';
import type { GameState } from '../../engine/types';
import { MISSIONS } from '../../missions';
import { SAMPLE_TRIP } from './sample';

const free = (): GameState => ({ ...newGame(), done: ['kuba'], day: 'czw', t: 830, money: 400, screen: 'mapPoland' });

registerDevJump({ id: 'maps-free', label: 'Po Kubie, bez zlecenia (czw 13:50)', make: free });
registerDevJump({
  id: 'trip-sample',
  label: 'Wyjazd próbny (W., czw 14:08)',
  make: () => {
    // Plan 20 może usunąć tę linię, kiedy W. ma własny TripDef.
    MISSIONS.w.trip ??= SAMPLE_TRIP;
    return { ...free(), active: 'w', t: 848, screen: 'mapCity', mapCityTab: 'poznan', mapCityDistrict: 'centrum' };
  },
});
