import type { TripDef } from '../../engine/trip';

/** Przykładowe zlecenie z wyjazdem (wartości jak dla W. z makiety). Do testów i skoku deweloperskiego. */
export const SAMPLE_TRIP: TripDef = {
  city: 'Poznań',
  mapLabel: 'centrala Banku Wiślanego, centrum Poznania',
  mapText: 'Dane z centrali Banku Wiślanego w centrum Poznania. Budynek trzeba znaleźć samemu.',
  packageFrom: 'W.',
  deadline: 19 * 60,
  progressSub: 'dane z centrali Banku Wiślanego',
  progress: [
    { title: 'Rozpoznanie', sub: 'mapa, telefon do banku, konto klienta' },
    { title: 'Podłożenie podsłuchu przy skrzynce', sub: 'wyjazd do Poznania' },
    { title: 'Połączenie z podsłuchem', sub: 'komputer w domu, Terminal → use S1' },
    { title: 'Zadanie właściwe', sub: 'zależy od zlecenia; tu: wejście do sieci banku i zdobycie danych' },
    { title: 'Oddanie zlecenia', sub: 'dane mailem do zleceniodawcy przed {dzień} 19:00' },
  ],
  tripStage: 1,
};
