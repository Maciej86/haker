export type Geo = {
  countries: Record<string, string>;
  voi: { n: string; d: string; c: [number, number] }[];
  rivers: { n: string; d: string }[];
};

let cache: Promise<Geo> | null = null;

/** Granice, województwa i rzeki. Osobna paczka, ładowana przy pierwszym otwarciu mapy. */
export function loadGeo(): Promise<Geo> {
  cache ??= import('./pl.json').then((m) => m.default as unknown as Geo);
  return cache;
}
