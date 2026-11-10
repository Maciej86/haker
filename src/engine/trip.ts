import type { MissionId } from './types';

export type TripDef = {
  city: string;            // miasto celu na mapie Polski, 'Poznań'
  mapLabel: string;        // pasek Mapy: „zlecenie: <mapLabel>”
  mapText: string;         // karta „◎ Zlecenie:” na mapie Polski
  packageFrom: string;     // 'W.' | 'L.'
  deadline: number;        // minuta dnia
  progressSub: string;     // podtytuł karty „Postęp zlecenia” na końcu wyjazdu
  progress: { title: string; sub: string }[]; // etapy karty (wstawka {dzień})
  tripStage: number;       // indeks etapu „Podłożenie podsłuchu przy skrzynce” w progress
};

export type TripState = { mission: MissionId | null; last: 'ok' | 'fled' | null; trips: number; suspicious: boolean };
export function initTripState(): TripState {
  return { mission: null, last: null, trips: 0, suspicious: false };
}
