// Teksty map miast: port mapa-miasta.html linie 199–204 (TIERS), 408–447 (DISTRICTS), 562 i 564 (tryb app=1).
import type { DistrictKey } from './types';

export const TIER_META: Record<'nt' | 'leszno', { label: string; tag: string; blurb: string }> = {
  nt: { label: 'Nowy Tomyśl', tag: 'małe miasto · start', blurb: 'Rodzinne miasto gracza. Jedna mapa bez dzielnic, rynek z ratuszem, przez miasto biegnie jedna droga przelotowa (ul. Poznańska). Przeważają domki, a przy rynku stoją niskie kamienice. Bank mieści się na parterze kamienicy przy rynku.' },
  leszno: { label: 'Leszno', tag: 'średnie miasto', blurb: 'Leszno, 61 tys. mieszkańców, ok. 60 km od domu w linii prostej. Jedna mapa bez dzielnic, około dwa razy większa od małego miasta. Dwie szersze ulice jednopasmowe i rynek. Są wszystkie wzory, ale biurowce są niższe. Bank stoi w budynku z biurami.' },
};

const GENERIC_BLURB = 'Najedź na budynek, żeby zobaczyć, kto w nim jest. Kliknij, żeby zaplanować tam wyjazd.';

export const DISTRICT_META: Record<DistrictKey, { name: string; label: string; tag: string; rows: [string, string][]; blurb: string }> = {
  centrum: {
    name: 'Centrum', label: 'Poznań · Centrum', tag: 'śródmieście',
    rows: [['zabudowa','wieżowce, biurowce, kamienice'],['miejsca','Dworzec Główny, Urząd Dzielnicy, Poczta']],
    blurb: 'Śródmieście. Drogi dwupasmowe, a w środku wieżowce: na piętrach hotele, biura, banki i restauracje. Najedź na budynek, żeby zobaczyć lokatorów pięter. Kliknij, żeby zaplanować tam wyjazd.',
  },
  jezyce: {
    name: 'Jeżyce', label: 'Poznań · Jeżyce', tag: 'kamienice',
    rows: [['zabudowa','kamienice z oficynami, podwórka'],['miejsca','targowisko, Urząd Dzielnicy, kawiarnie']],
    blurb: GENERIC_BLURB,
  },
  winogrady: {
    name: 'Winogrady', label: 'Poznań · Winogrady', tag: 'osiedla bloków',
    rows: [['zabudowa','bloki z wielkiej płyty, szkoły, place zabaw'],['miejsca','przychodnia, poczta, pawilony handlowe']],
    blurb: GENERIC_BLURB,
  },
  grunwald: {
    name: 'Grunwald', label: 'Poznań · Grunwald', tag: 'mieszana',
    rows: [['zabudowa','biurowce, kamienice, bloki, domki na obrzeżach'],['miejsca','Szpital Miejski, Urząd Dzielnicy, targi']],
    blurb: GENERIC_BLURB,
  },
  wilda: {
    name: 'Wilda', label: 'Poznań · Wilda', tag: 'kamienice i zakłady',
    rows: [['zabudowa','kamienice, hale dawnych zakładów'],['miejsca','zakłady metalowe, poczta, rynek wildecki']],
    blurb: GENERIC_BLURB,
  },
  rataje: {
    name: 'Rataje', label: 'Poznań · Rataje', tag: 'za rzeką, bloki',
    rows: [['zabudowa','osiedla bloków za Wartą'],['miejsca','Galeria Przystań, poczta, szkoły']],
    blurb: GENERIC_BLURB,
  },
  lawica: {
    name: 'Ławica', label: 'Poznań · Ławica', tag: 'domki, przy lotnisku',
    rows: [['zabudowa','domki jednorodzinne, kilka bloków'],['miejsca','Port Lotniczy Poznań-Warta (obok), poczta']],
    blurb: GENERIC_BLURB,
  },
};

export const DKEYS: DistrictKey[] = ['centrum','jezyce','winogrady','grunwald','wilda','rataje','lawica'];

export const CITY_BLURB = {
  title: 'Poznań',
  tag: 'duże miasto · 7 dzielnic',
  text: 'Widok całego miasta. Granice dzielnic biegną ulicami, a Warta oddziela Rataje. Najedź na dzielnicę, żeby zobaczyć, co w niej jest, i kliknij, żeby wejść. Lotnisko leży na zachodzie, za Ławicą.',
};
