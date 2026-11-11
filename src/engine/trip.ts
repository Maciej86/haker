import type { GameState, Line, MissionId, StepResult } from './types';
import { andThen, step } from './types';
import { advance, dur, gclk } from './clock';
import { missionDef } from './missions';
import { gain } from './skills';
import { fmtSkill } from './text';
import { rng } from './rng';
import type { CityPlace } from '../world/city/types';
import { TALK, type TalkKey, type TalkKind } from '../world/trip/talk';

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

// ================= Na miejscu (wyjazd.tpl.html 338–357) =================
export type TripTarget = { place: CityPlace; building: number; isTarget: boolean };
export type SiteStepId = 'package' | 'look' | 'open' | 'plug' | 'test' | 'close';
export type SiteStep = { id: SiteStepId; title: string; sub: string; minutes: number; ms: number };

const SITE_STEPS: SiteStep[] = [
  { id: 'package', title: 'Odbierasz paczkę', sub: 'przystanek autobusowy obok banku', minutes: 3, ms: 1200 },
  { id: 'look', title: 'Rozglądasz się', sub: 'czy nikt nie patrzy', minutes: 1, ms: 900 },
  { id: 'open', title: 'Otwierasz szafkę', sub: 'klucz z plecaka na zamek', minutes: 1, ms: 900 },
  { id: 'plug', title: 'Podpinasz PODSŁUCH-1', sub: 'urządzenie z plecaka do wolnego portu', minutes: 2, ms: 1200 },
  { id: 'test', title: 'Test łącza', sub: 'telefon z plecaka na urządzenie', minutes: 1, ms: 1400 },
  { id: 'close', title: 'Zamykasz szafkę', sub: 'zostawiasz wszystko jak było', minutes: 1, ms: 900 },
];

/** PODSŁUCH-1 (i klucz) już w plecaku, np. po ucieczce. */
export function hasPackage(s: GameState): boolean {
  return s.devices.some((d) => d.id === 'bug1' && d.where === 'plecak');
}

export function siteSteps(withPackage: boolean): SiteStep[] {
  return withPackage ? SITE_STEPS.filter((x) => x.id !== 'package') : SITE_STEPS.slice();
}

// ================= Przechodzień (359–405) =================
export type { TalkKind, TalkKey };
export type TalkState = { round: number; good: number; mid: number; last: TalkKind | null; end: 'ok' | 'fled' | null };

export function initTalk(): TalkState {
  return { round: 0, good: 0, mid: 0, last: null, end: null };
}

export function talkKey(t: TalkState): TalkKey {
  if (t.round === 0) return 'start';
  if (t.good && t.mid) return 'last';
  return t.last === 'good' ? 'afterGood' : 'afterMid';
}

export function talkQuestion(t: TalkState, minute: number): string {
  return TALK[talkKey(t)].q(minute);
}

/** Cztery odpowiedzi w kolejności stałej dla ziarna: klucz z `rng`, sortowanie rosnące po liczbach. */
export function talkOptions(seed: number, t: TalkState): [TalkKind, string][] {
  const r = rng(seed + t.round * 7 + t.good * 3 + t.mid + 11);
  return TALK[talkKey(t)].o
    .map((o) => ({ k: r(), o }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.o);
}

export function talkAnswer(t: TalkState, pick: TalkKind): TalkState {
  if (t.end) return t;
  const n: TalkState = { ...t, round: t.round + 1, last: pick };
  if (pick === 'flee') return { ...n, end: 'fled' };
  if (pick === 'good') n.good++;
  else n.mid++;
  if (n.good >= 2) n.end = 'ok';
  else if (n.mid >= 2 || n.round >= 3) n.end = 'fled';
  return n;
}

export function talkReaction(prev: TalkState, pick: TalkKind, next: TalkState): string {
  if (pick === 'flee') return 'Ej! Stój! Dzwonię na policję!';
  if (next.end === 'ok') return 'No dobra, niech pan robi swoje. Chodź, Fafik.';
  if (next.end === 'fled' && next.mid >= 2) return 'Wie pan co, ja jednak zadzwonię na policję.';
  return TALK[talkKey(prev)].re[pick] ?? '';
}

export function talkGain(t: TalkState): { v: number; why: string; badge: string } | null {
  if (t.end === 'ok') {
    return t.mid === 0
      ? { v: 0.6, why: 'rozmowa z przechodniem, gładko', badge: 'wybrnięte gładko' }
      : { v: 0.4, why: 'rozmowa z przechodniem, z trudem', badge: 'wybrnięte z trudem' };
  }
  if (t.end === 'fled') return { v: 0.15, why: 'rozmowa z przechodniem, ucieczka', badge: 'nauczka na przyszłość' };
  return null;
}

/** Minuty przy skrzynce: pełna procedura, a przy ucieczce tylko do otwarcia szafki; każda runda rozmowy to minuta. */
export function siteMinutes(withPackage: boolean, talk: TalkState): number {
  const steps = siteSteps(withPackage);
  const mins = (ids: SiteStepId[] | null) => steps.filter((x) => !ids || ids.includes(x.id)).reduce((a, x) => a + x.minutes, 0);
  return (talk.end === 'ok' ? mins(null) : mins(['package', 'look', 'open'])) + talk.round;
}

// ================= Wynik, blokady, zapis =================
export type TripResult = { transport: TransportId; talk: TalkState };
export type TripOutcome = { outcome: 'ok' | 'fled'; siteStart: number; siteEnd: number; backDep: number | null; end: number; cost: number };

export function tripOutcome(s: GameState, r: TripResult): TripOutcome {
  const plan = planFor(s.t, r.transport);
  const siteStart = plan.arrive;
  const siteEnd = siteStart + siteMinutes(hasPackage(s), r.talk);
  const back = backLeg(r.transport, siteEnd);
  return { outcome: r.talk.end === 'ok' ? 'ok' : 'fled', siteStart, siteEnd, backDep: back.dep ?? null, end: back.t1, cost: plan.cost };
}

export const TRIP_FAILED_SUB = 'nieudane, jedź jeszcze raz';

export function tripFailed(s: GameState): boolean {
  return s.active !== null && s.trip.mission === s.active && s.trip.last === 'fled';
}

export function tripBlock(s: GameState, target: TripTarget): string | null {
  const def = missionDef(s.active);
  if (!def?.trip) return def?.noTripText ?? 'Najpierw przyjmij zlecenie w Poczcie.';
  if (!target.isTarget) return 'Tu nie ma nic, co pomoże w zleceniu. Wyjazd zabrałby czas i pieniądze.';
  const bug = s.devices.find((d) => d.id === 'bug1' && d.where === 'S1');
  if (bug) {
    if (hasPackage(s)) return 'Nowy PODSŁUCH-1 masz w plecaku: podmienisz go przyciskiem w karcie „Postęp zlecenia”.';
    return bug.minutes > 0
      ? `Twój PODSŁUCH-1 już wisi przy S1 (zapas ${bug.minutes} min). Połącz się: use S1. Na wymianę kup nowy w Darknecie.`
      : 'Twój PODSŁUCH-1 przy S1 jest wyczerpany. Nowy kupisz w Darknecie.';
  }
  return null;
}

export function planTrip(s: GameState, target: TripTarget): StepResult {
  const block = tripBlock(s, target);
  if (block) return step(s, [], [{ kind: 'toast', text: block, bad: true }]);
  return step({ ...s, screen: 'trip' });
}

export function cancelTrip(s: GameState): GameState {
  return { ...s, screen: 'mapCity', mapCityTab: 'poznan', mapCityDistrict: 'centrum' };
}

export function finishTrip(s: GameState, r: TripResult): StepResult {
  if (s.screen !== 'trip') return step(s);
  const o = tripOutcome(s, r);
  const fled = o.outcome === 'fled';
  const carried = s.devices.find((d) => d.id === 'bug1' && d.where === 'plecak');
  const minutes = carried?.minutes ?? 60;
  let n = advance(s, o.end - s.t, 0); // podsłuch nie pracuje w drodze
  n = {
    ...n,
    money: s.money - o.cost,
    devices: [
      ...s.devices.filter((d) => d.id !== 'bug1'),
      { id: 'bug1', where: fled ? 'plecak' : 'S1', minutes },
    ],
    trip: { mission: s.active, last: o.outcome, trips: s.trip.trips + 1, suspicious: s.trip.suspicious || fled },
    screen: 'desktop',
  };
  const lines: Line[] = [];
  const clk = gclk(n);
  if (fled) {
    lines.push({ html: `<span class="d">${clk} · wróciłeś do domu. PODSŁUCH-1 i klucz do szafki są w plecaku.</span> <span class="r">Podłożenie podsłuchu nieudane: jedź jeszcze raz (Mapa → Poznań → Centrum).</span>` });
  } else {
    lines.push({ html: `<span class="d">${clk} · wróciłeś do domu. PODSŁUCH-1 czeka podpięty w szafce przy skrzynce S1.</span>` });
    const dl = missionDef(s.active)?.trip?.deadline;
    if (dl !== undefined && dl - n.t < 45) {
      lines.push({ html: `<span class="r">Do terminu zostało tylko ${n.t < dl ? dur(dl - n.t) : '0 min'}. Godzina pochodzi z wyjazdu.</span>` });
    }
  }
  let res: StepResult = step(n, lines);
  const g = talkGain(r.talk);
  if (g) {
    res = andThen(res, (st) => {
      const gr = gain(st, 'Social', g.v, g.why);
      return { ...gr, lines: [{ html: `<span class="c">Z wyjazdu: +${fmtSkill(g.v)} Social</span> <span class="d">(rozmowa z przechodniem)</span>` }] };
    });
  }
  const done = missionDef(s.active)?.onTripDone;
  return done ? andThen(res, done) : res;
}
