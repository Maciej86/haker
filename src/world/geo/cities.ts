// Dane mapy Polski z mapa-polski.tpl.html (linie 98–144, 188–200), z poprawkami z planu 04.
import type { Day } from '../../engine/types';
import type { TripDef } from '../../engine/trip';
import { hhmm } from '../../engine/clock';

export type Tier = 'big' | 'medium' | 'small';
export type City = { n: string; lo: number; la: number; pop: number; voi: string; rail: 0 | 1; tier: Tier };

// [nazwa, lon, lat, mieszkańcy tys., województwo, kolej?]
const RAW: [string, number, number, number, string, 0 | 1][] = [
  ['Warszawa', 21.01, 52.23, 1860, 'mazowieckie', 1], ['Kraków', 19.94, 50.06, 806, 'małopolskie', 1], ['Wrocław', 17.04, 51.11, 674, 'dolnośląskie', 1], ['Łódź', 19.46, 51.76, 655, 'łódzkie', 1],
  ['Poznań', 16.93, 52.41, 541, 'wielkopolskie', 1], ['Gdańsk', 18.65, 54.35, 486, 'pomorskie', 1], ['Szczecin', 14.55, 53.43, 391, 'zachodniopomorskie', 1], ['Lublin', 22.57, 51.25, 332, 'lubelskie', 1],
  ['Bydgoszcz', 18.01, 53.12, 330, 'kujawsko-pomorskie', 1], ['Białystok', 23.16, 53.13, 294, 'podlaskie', 1], ['Katowice', 19.02, 50.26, 280, 'śląskie', 1],
  ['Gdynia', 18.53, 54.52, 243, 'pomorskie', 1], ['Częstochowa', 19.12, 50.81, 210, 'śląskie', 1], ['Radom', 21.15, 51.40, 199, 'mazowieckie', 1], ['Rzeszów', 22.00, 50.04, 198, 'podkarpackie', 1],
  ['Toruń', 18.60, 53.01, 196, 'kujawsko-pomorskie', 1], ['Kielce', 20.63, 50.87, 186, 'świętokrzyskie', 1], ['Olsztyn', 20.48, 53.78, 170, 'warmińsko-mazurskie', 1], ['Bielsko-Biała', 19.04, 49.82, 167, 'śląskie', 1],
  ['Zielona Góra', 15.51, 51.94, 138, 'lubuskie', 1], ['Opole', 17.93, 50.67, 126, 'opolskie', 1], ['Gorzów Wielkopolski', 15.24, 52.73, 119, 'lubuskie', 1], ['Elbląg', 19.40, 54.16, 115, 'warmińsko-mazurskie', 1],
  ['Płock', 19.71, 52.55, 113, 'mazowieckie', 1], ['Wałbrzych', 16.28, 50.77, 108, 'dolnośląskie', 1], ['Włocławek', 19.07, 52.65, 105, 'kujawsko-pomorskie', 1], ['Tarnów', 20.99, 50.01, 105, 'małopolskie', 1],
  ['Koszalin', 16.17, 54.19, 105, 'zachodniopomorskie', 1], ['Kalisz', 18.09, 51.76, 98, 'wielkopolskie', 1], ['Legnica', 16.16, 51.21, 97, 'dolnośląskie', 1], ['Grudziądz', 18.75, 53.48, 92, 'kujawsko-pomorskie', 1],
  ['Słupsk', 17.03, 54.46, 88, 'pomorskie', 1], ['Nowy Sącz', 20.69, 49.62, 82, 'małopolskie', 1], ['Jelenia Góra', 15.73, 50.90, 77, 'dolnośląskie', 1], ['Siedlce', 22.29, 52.17, 77, 'mazowieckie', 1],
  ['Piła', 16.74, 53.15, 72, 'wielkopolskie', 1], ['Konin', 18.25, 52.22, 70, 'wielkopolskie', 1], ['Suwałki', 22.93, 54.10, 69, 'podlaskie', 1], ['Gniezno', 17.60, 52.53, 66, 'wielkopolskie', 1],
  ['Leszno', 16.57, 51.84, 61, 'wielkopolskie', 1], ['Łomża', 22.06, 53.18, 62, 'podlaskie', 1], ['Zamość', 23.25, 50.72, 60, 'lubelskie', 1], ['Chełm', 23.47, 51.13, 60, 'lubelskie', 1],
  ['Przemyśl', 22.77, 49.78, 57, 'podkarpackie', 1], ['Ełk', 22.36, 53.83, 61, 'warmińsko-mazurskie', 1], ['Krosno', 21.77, 49.69, 45, 'podkarpackie', 1], ['Sieradz', 18.73, 51.60, 40, 'łódzkie', 1],
  ['Sopot', 18.57, 54.44, 34, 'pomorskie', 1], ['Zakopane', 19.95, 49.30, 27, 'małopolskie', 1], ['Kościan', 16.65, 52.09, 23, 'wielkopolskie', 1], ['Płońsk', 20.38, 52.62, 22, 'mazowieckie', 0],
  ['Świebodzin', 15.53, 52.25, 21, 'lubuskie', 1], ['Szamotuły', 16.58, 52.61, 18.5, 'wielkopolskie', 1], ['Nowy Tomyśl', 16.13, 52.32, 15, 'wielkopolskie', 1], ['Grodzisk Wielkopolski', 16.37, 52.23, 14, 'wielkopolskie', 1],
  ['Wolsztyn', 16.12, 52.12, 13, 'wielkopolskie', 1], ['Brzeziny', 19.75, 51.80, 12, 'łódzkie', 0], ['Międzychód', 15.89, 52.60, 10, 'wielkopolskie', 0], ['Opalenica', 16.41, 52.31, 9.5, 'wielkopolskie', 1],
  ['Zbąszyń', 15.92, 52.25, 7, 'wielkopolskie', 1], ['Buk', 16.52, 52.36, 6, 'wielkopolskie', 0], ['Hel', 18.80, 54.61, 3, 'pomorskie', 1], ['Kazimierz Dolny', 21.95, 51.32, 2.5, 'lubelskie', 0],
];

export const CITIES: City[] = RAW.map(([n, lo, la, pop, voi, rail]) => ({
  n, lo, la, pop, voi, rail, tier: pop >= 250 ? 'big' : pop >= 20 ? 'medium' : 'small',
}));

export const LPOS: Record<string, 'l' | 'r' | 't' | 'b'> = {
  'Szamotuły': 'r', 'Międzychód': 'l', 'Kościan': 'b', 'Zbąszyń': 'l', 'Świebodzin': 'l', 'Opalenica': 'r', 'Buk': 't',
  'Nowy Tomyśl': 'l', 'Grodzisk Wielkopolski': 'b', 'Toruń': 'b', 'Płock': 'b', 'Tarnów': 'b', 'Gdynia': 'l', 'Sopot': 'l', 'Poznań': 't',
};

export const HOME_CITY = 'Nowy Tomyśl';
/** Miasta z własną mapą w demo. */
export const CITY_TAB: Partial<Record<string, 'nt' | 'leszno' | 'poznan'>> = { 'Nowy Tomyśl': 'nt', 'Leszno': 'leszno', 'Poznań': 'poznan' };
/** Otwarte, ale bez mapy w demo. */
export const OPEN_NO_MAP = ['Grodzisk Wielkopolski', 'Opalenica', 'Zbąszyń', 'Buk', 'Wolsztyn'];
export const isOpen = (n: string): boolean => n in CITY_TAB || OPEN_NO_MAP.includes(n);

export type Road = [string, [number, number][]];
// drogi szybkiego ruchu (przebieg przybliżony, przez prawdziwe miasta)
export const ROADS: Road[] = [
  ['A2', [[14.65, 52.31], [15.53, 52.25], [16.13, 52.32], [16.93, 52.41], [18.25, 52.22], [19.6, 51.92], [21.01, 52.23], [22.29, 52.17]]],
  ['A1', [[18.65, 54.35], [18.60, 53.01], [19.07, 52.65], [19.6, 51.92], [19.70, 51.40], [19.12, 50.81], [19.02, 50.26], [18.42, 49.93]]],
  ['A4', [[15.04, 51.13], [16.16, 51.21], [17.04, 51.11], [17.93, 50.67], [18.67, 50.29], [19.02, 50.26], [19.94, 50.06], [20.99, 50.01], [22.00, 50.04], [23.08, 49.96]]],
  ['S3', [[14.25, 53.91], [14.55, 53.43], [15.24, 52.73], [15.53, 52.25], [15.51, 51.94], [16.16, 51.21], [16.0, 50.70]]],
  ['S5', [[18.45, 53.6], [18.01, 53.12], [17.60, 52.53], [16.93, 52.41], [16.57, 51.84], [17.04, 51.11]]],
  ['S7', [[18.65, 54.35], [19.40, 54.16], [20.38, 52.62], [21.01, 52.23], [21.15, 51.40], [20.63, 50.87], [19.94, 50.06], [19.95, 49.6]]],
  ['S8', [[17.04, 51.11], [18.73, 51.60], [19.70, 51.40], [19.6, 51.92], [21.01, 52.23], [23.16, 53.13]]],
  ['S17', [[21.01, 52.23], [22.57, 51.25], [23.25, 50.72]]],
  ['S19', [[22.57, 51.25], [22.00, 50.04]]],
];

/** [lon, lat, nazwa, czy to lotnisko Poznań-Warta]. Nazwy w grze są fikcyjne. */
export type Airport = [number, number, string, 1?];
export const AIRPORTS: Airport[] = [
  [20.97, 52.17, 'Warszawa'], [20.65, 52.45, 'Warszawa (drugie)'], [19.80, 50.08, 'Kraków'], [18.47, 54.38, 'Gdańsk'], [19.08, 50.47, 'Katowice'], [16.88, 51.10, 'Wrocław'],
  [16.83, 52.42, 'Poznań', 1], [19.40, 51.72, 'Łódź'], [22.02, 50.11, 'Rzeszów'], [14.90, 53.58, 'Szczecin'], [17.98, 53.10, 'Bydgoszcz'], [22.71, 51.24, 'Lublin'], [20.94, 53.48, 'Olsztyn'], [15.80, 52.14, 'Zielona Góra'], [21.21, 51.39, 'Radom'],
];

export const TIERN: Record<Tier, string> = { small: 'małe', medium: 'średnie', big: 'duże' };

/** Poziom, od którego miasto się odblokowuje (makieta, linia 122). */
export function lockLevel(c: City): number {
  return c.tier === 'big' ? (c.n === 'Warszawa' ? 15 : c.n === 'Kraków' || c.n === 'Gdańsk' ? 12 : 10)
    : c.tier === 'medium' ? (c.pop > 100 ? 7 : 5) : 3;
}

type Pos = { lo: number; la: number };
const hav = (a: Pos, b: Pos): number => {
  const R = 6371, t = Math.PI / 180, dla = (b.la - a.la) * t, dlo = (b.lo - a.lo) * t;
  const x = Math.sin(dla / 2) ** 2 + Math.cos(a.la * t) * Math.cos(b.la * t) * Math.sin(dlo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};
const home = (): City => CITIES.find((c) => c.n === HOME_CITY)!;

export const fmtT = (m: number): string =>
  m < 60 ? `${Math.round(m)} min` : `${Math.floor(m / 60)} h ${String(Math.round(m % 60)).padStart(2, '0')} min`;

// prawdziwe czasy z rozkładu; reszta to szacunek ze wzoru
const RAIL: Record<string, [string, number][]> = { 'Poznań': [['ekspres', 30], ['regionalny', 46]] };

export function travel(c: Pos & { rail: 0 | 1 }): { d: number; car: number; carC: number; tr: number | null; trC: number | null } {
  const h = home();
  const d = hav(h, c) * 1.3;
  const fast = d > 40;
  const car = (d / (fast ? 75 : 55)) * 60 + 8;
  const tr = c.rail && h.rail ? (d / 70) * 60 + 20 : null;
  return { d, car, carC: Math.round(d * 0.5), tr, trC: tr ? Math.round(5 + d * 0.25) : null };
}

export type CardRow = [string, string, string?];
export type CityCard = {
  kind: string; title: string; rows: CardRow[];
  foot: { text: string; tone: 'acc' | 'dim' | 'coin' };
};

/** Karta miasta (port `cityCard`). `trip` to zlecenie z wyjazdem albo null. */
export function cityCardRows(c: City, trip: TripDef | null, day: Day): CityCard {
  const t = travel(c);
  const open = isOpen(c.n), isHome = c.n === HOME_CITY, mis = !!trip && c.n === trip.city;
  const rows: CardRow[] = [
    ['wielkość', `${TIERN[c.tier]} · ${c.pop >= 100 ? Math.round(c.pop) + ' tys.' : c.pop + ' tys.'} mieszkańców`],
    ['województwo', c.voi],
  ];
  if (c.tier === 'big') rows.push(['mapa', 'podział na dzielnice']);
  if (isHome) rows.push(['', 'tu mieszkasz, stąd liczy się każdy dojazd', 'h']);
  else {
    rows.push(['z domu', `ok. ${Math.round(t.d)} km`]);
    rows.push(['samochód', `${fmtT(t.car)}, ${t.carC} ¤ w jedną stronę`]);
    if (RAIL[c.n]) RAIL[c.n].forEach(([k, m]) => rows.push(['pociąg', `${k} ${fmtT(m)} (rozkład), ${k === 'ekspres' ? Math.round(t.trC! * 1.6) : t.trC} ¤`, 'h']));
    else rows.push(['pociąg', t.tr ? `ok. ${fmtT(t.tr)} (szacunek), ${t.trC} ¤` : 'brak połączenia kolejowego']);
  }
  const ap = AIRPORTS.find((a) => a[2] === c.n);
  if (ap) rows.push(['lotnisko', ap[3] ? 'Port Lotniczy Poznań-Warta' : 'tak (nazwa w grze fikcyjna)']);
  if (mis) rows.push(['zlecenie', trip!.mapText + ' Termin: ' + day + ' ' + hhmm(trip!.deadline), 't']);
  let foot: CityCard['foot'];
  if (open) foot = c.n in CITY_TAB ? { text: '▸ kliknij, żeby wejść na mapę miasta', tone: 'acc' } : { text: '▸ niedostępne w demo', tone: 'dim' };
  else foot = { text: `🔒 odblokowanie: poziom ${lockLevel(c)}${c.tier === 'big' ? ' i wątek fabularny' : ''}`, tone: 'coin' };
  return { kind: `${isHome ? 'miasto rodzinne' : 'miasto'} · ${TIERN[c.tier]}`, title: (isHome ? '⌂ ' : '') + c.n, rows, foot };
}

/** Karta lotniska (port `airCard`). Lotnisko Poznań-Warta też jest niedostępne w demo. */
export function airportCard(a: Airport): { kind: string; title: string; rows: CardRow[]; foot: null } {
  const near = CITIES.reduce((m, c) => (hav({ lo: a[0], la: a[1] }, c) < hav({ lo: a[0], la: a[1] }, m) ? c : m));
  const t = travel({ lo: a[0], la: a[1], rail: 0 });
  const rows: CardRow[] = [
    ['przy mieście', near.n],
    ['z domu', `ok. ${Math.round(t.d)} km, ${fmtT(t.car)} samochodem`],
    ['w grze', a[3] ? 'niedostępne w demo' : 'nazwa fikcyjna, mapa później'],
  ];
  return { kind: 'lotnisko', title: a[3] ? 'Port Lotniczy Poznań-Warta' : 'Lotnisko · ' + a[2], rows, foot: null };
}
