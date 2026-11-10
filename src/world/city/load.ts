// Leniwe ładowanie danych miast: każdy JSON to osobna paczka.
import type { CityView, Scene, SceneKey, TripRoutes } from './types';

const files = import.meta.glob<{ default: unknown }>('./*.json');

async function load<T>(name: string): Promise<T> {
  const f = files[`./${name}.json`];
  if (!f) throw new Error(`Brak danych miasta: ${name}`);
  return (await f()).default as T;
}

export const loadScene = (k: SceneKey): Promise<Scene> => load<Scene>(k);
export const loadCity = (): Promise<CityView> => load<CityView>('poznan');
export const loadTripRoutes = (): Promise<TripRoutes> => load<TripRoutes>('trip-routes');
