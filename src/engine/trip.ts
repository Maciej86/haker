import type { GameState, MissionId } from './types';

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

// ================= Środki transportu i rozkład (wyjazd.tpl.html 185–211) =================

export type TransportId = 'regio' | 'ic' | 'car';
export type Transport = {
  id: TransportId; name: string; sub: string; kind: 'train' | 'car';
  ride: number; cost: number; park: number; out: number[] | null; back: number[] | null;
};

/** Odjazdy od 5:00 + `minute`, co `every` minut, do 26:00 (czyli do 2:00 w nocy). */
export function schedule(minute: number, every: number): number[] {
  const r: number[] = [];
  for (let t = 5 * 60 + minute; t < 26 * 60; t += every) r.push(t);
  return r;
}

export const TRANSPORTS: Record<TransportId, Transport> = {
  regio: { id: 'regio', name: 'Pociąg regionalny', sub: 'Koleje Lechickie', kind: 'train', ride: 46, cost: 23, park: 0, out: schedule(11, 30), back: schedule(20, 30) },
  ic: { id: 'ic', name: 'Ekspres', sub: 'Polska Kolej Ekspresowa, miejscówka', kind: 'train', ride: 30, cost: 37, park: 0, out: schedule(32, 60), back: schedule(58, 60) },
  car: { id: 'car', name: 'Samochód', sub: 'A2, parking w Centrum blisko skrzynki, bez rozkładu', kind: 'car', ride: 65, cost: 25, park: 8, out: null, back: null },
};

/** Czasy dojścia policzone w Node na mapach z makiety (walkNT=17, walkPZ=13, driveC=6, walkPZcar=2). */
export const WALK = { homeStation: 17, stationS1: 13, carStart: 4, carCity: 6, parking: 6, parkS1: 2 } as const;
/** Paczka, szafka, podpięcie, test, zapas na rozmowę. */
export const SITE_PLAN_MIN = 12;

export type LegId = 'walk1' | 'wait1' | 'ride1' | 'walk2' | 'drive2' | 'park' | 'site' | 'back';
export type Leg = {
  id: LegId; name: string; mode: string; t0: number; t1: number;
  map: 'nt' | 'pl' | 'pz' | null; dep?: number; wait?: number;
};
export type TripPlan = {
  transport: TransportId; legs: Leg[]; dep: number | null;
  arrive: number; backDep: number | null; end: number; cost: number;
};

const lastPlus = (list: number[]) => list[list.length - 1] + 60;

/** Odcinek powrotu po zakończeniu pracy przy skrzynce o minucie `siteEnd`. */
export function backLeg(id: TransportId, siteEnd: number): Leg {
  const t = TRANSPORTS[id];
  if (t.kind === 'train') {
    const at = siteEnd + WALK.stationS1;
    const dep = t.back!.find((x) => x >= at) ?? lastPlus(t.back!);
    return {
      id: 'back', name: `Powrót: ${t.name} → Nowy Tomyśl`, mode: 'POWRÓT', map: 'pl',
      t0: siteEnd, t1: dep + t.ride + WALK.homeStation, dep, wait: dep - at,
    };
  }
  return {
    id: 'back', name: 'Powrót samochodem do domu', mode: 'POWRÓT', map: 'pl',
    t0: siteEnd, t1: siteEnd + WALK.parkS1 + WALK.carCity + t.ride,
  };
}

export function planFor(start: number, id: TransportId): TripPlan {
  const t = TRANSPORTS[id];
  const legs: Leg[] = [];
  let c = start;
  const push = (l: Omit<Leg, 't0' | 't1'>, len: number) => { legs.push({ ...l, t0: c, t1: c + len }); c += len; };
  let dep: number | null = null;
  if (t.kind === 'train') {
    push({ id: 'walk1', name: 'Dom → dworzec Nowy Tomyśl', mode: 'PIESZO', map: 'nt' }, WALK.homeStation);
    dep = t.out!.find((x) => x >= c) ?? lastPlus(t.out!);
    push({ id: 'wait1', name: 'Czekasz na pociąg', mode: 'PERON', map: null }, dep - c);
    push({ id: 'ride1', name: `${t.name} → Poznań Główny`, mode: 'POCIĄG', map: 'pl' }, t.ride);
    push({ id: 'walk2', name: 'Poznań Główny → skrzynka S1', mode: 'PIESZO', map: 'pz' }, WALK.stationS1);
  } else {
    push({ id: 'walk1', name: 'Wyjeżdżasz spod domu', mode: 'AUTO', map: 'nt' }, WALK.carStart);
    push({ id: 'ride1', name: 'Autostradą A2 do Poznania', mode: 'AUTO', map: 'pl' }, t.ride - WALK.carStart);
    push({ id: 'drive2', name: 'Przez Centrum do skrzynki', mode: 'AUTO', map: 'pz' }, WALK.carCity);
    push({ id: 'park', name: 'Szukasz miejsca do parkowania', mode: 'PARKING', map: null }, WALK.parking);
    push({ id: 'walk2', name: 'Parking → skrzynka S1', mode: 'PIESZO', map: 'pz' }, WALK.parkS1);
  }
  const arrive = c;
  push({ id: 'site', name: 'Przy skrzynce S1', mode: 'NA MIEJSCU', map: null }, SITE_PLAN_MIN);
  const back = backLeg(id, c);
  legs.push(back);
  return {
    transport: id, legs, dep, arrive,
    backDep: back.dep ?? null, end: back.t1, cost: 2 * t.cost + t.park,
  };
}

export function transportOptions(s: GameState): { id: TransportId; plan: TripPlan; affordable: boolean }[] {
  return (['regio', 'ic', 'car'] as TransportId[]).map((id) => {
    const plan = planFor(s.t, id);
    return { id, plan, affordable: s.money >= plan.cost };
  });
}
