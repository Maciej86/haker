// Przejścia między mapami. Oglądanie map nie zmienia czasu ani pieniędzy.
import type { GameState } from './types';
import type { DistrictKey } from '../world/city/types';

export type CityTab = 'nt' | 'leszno' | 'poznan';

export function openCity(s: GameState, tab: CityTab): GameState {
  return { ...s, screen: 'mapCity', mapCityTab: tab, mapCityDistrict: null };
}

export function openDistrict(s: GameState, d: DistrictKey | null): GameState {
  return { ...s, screen: 'mapCity', mapCityTab: 'poznan', mapCityDistrict: d };
}

export function toPoland(s: GameState): GameState {
  return { ...s, screen: 'mapPoland' };
}

export function toDesktop(s: GameState): GameState {
  return { ...s, screen: 'desktop' };
}
