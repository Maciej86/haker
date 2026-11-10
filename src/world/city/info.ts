// Karty budynków i dzielnic: port genericInfo (mapa-miasta.html 179–188), tytułu karty (598)
// i karty dzielnicy (585–586). Tryb gry (app=1): bez oznaczeń celu.
import { rng } from '../../engine/rng';
import names from './names.json';
import { DISTRICT_META } from './meta';
import type { Box, CityView, DistrictKey, Tenant } from './types';

const FLOOR = 6;
const { SHOPS, OFFICES } = names as { SHOPS: string[]; OFFICES: string[] };

const TYPE: Record<string, string> = {
  old: 'kamienica', modern: 'biurowiec', slab: 'blok mieszkalny', house: 'dom jednorodzinny', hip: 'dom', school: 'szkoła',
  market: 'market', podium: 'pawilon', tower: 'wieżowiec', shed: 'garaże', place: 'budynek użyteczności',
};

/** Typ, liczba kondygnacji i lokatorzy budynku (stali lokatorzy z danych albo losowi z ziarna indeksu). */
export function buildingInfo(b: Box, i: number): { type: string; floors: number; tenants: Tenant[] } {
  const r = rng(i * 7919 + 13);
  const p = (a: string[]) => a[Math.floor(r() * a.length)];
  const floors = Math.max(1, Math.round(b.h / FLOOR));
  const t: Tenant[] = [];
  if (b.kind === 'old') {
    if (r() < .6) t.push({ n: p(SHOPS), f: 'parter' });
    t.push({ n: 'mieszkania', f: floors > 1 ? `p. ${t.length ? 1 : 0}–${floors - 1}` : 'parter' });
  } else if (b.kind === 'modern') {
    const k = 2 + Math.floor(r() * 2); let fl = 0;
    for (let j = 0; j < k; j++) { const n = Math.max(1, Math.floor(floors / k)); t.push({ n: p(OFFICES), f: `p. ${fl}–${Math.min(floors - 1, fl + n - 1)}` }); fl += n; }
  } else if (b.kind === 'slab') {
    t.push({ n: 'mieszkania', f: `p. 0–${floors - 1}` });
    if (r() < .3) t.unshift({ n: p(SHOPS), f: 'parter, lokal użytkowy' });
  } else if (b.house) t.push({ n: 'mieszkanie prywatne', f: '' });
  else if (b.kind === 'podium') { t.push({ n: p(SHOPS), f: 'parter' }); t.push({ n: p(SHOPS), f: 'parter' }); }
  else if (b.kind === 'shed') t.push({ n: 'garaże i komórki', f: '' });
  const type = b.home ? 'dom gracza' : b.tower ? 'wieżowiec' : TYPE[b.kind] || 'budynek';
  return { type, floors, tenants: b.tenants ?? t };
}

/** Nagłówek karty budynku. */
export function buildingTitle(b: Box): string {
  return b.label && !b.home ? b.label : b.tower ? 'Wieżowiec' : b.home ? 'Twój dom' : 'W budynku';
}

/** Odmiana jak w makiecie: 1 kondygnacja, 2–4 kondygnacje, 5+ kondygnacji. */
export function floorsWord(n: number): string {
  return n === 1 ? 'kondygnacja' : n < 5 ? 'kondygnacje' : 'kondygnacji';
}

/** Karta dzielnicy na mapie Poznania: liczba kwartałów, dojazd z Dworca Głównego, wiersze opisu. */
export function districtCard(C: CityView, k: DistrictKey): { n: number; fromStation: string; rows: [string, string][] } {
  const dw = C.dworzec, dc = C.dists[k];
  const km = Math.hypot(dc.cx - dw.x - dw.w / 2, dc.cy - dw.y - dw.d / 2) * 1.3 * 3.2 / 1000;
  const tram = Math.round(km / 16 * 60 + 6), car = Math.round(km / 22 * 60 + 4);
  const fromStation = k === 'centrum' ? 'na miejscu (dworzec w Centrum)'
    : `ok. ${km.toFixed(1).replace('.', ',')} km · tramwaj ${tram} min · taxi ${car} min`;
  return { n: dc.n, fromStation, rows: DISTRICT_META[k].rows };
}
