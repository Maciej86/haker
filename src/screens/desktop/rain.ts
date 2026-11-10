// Deszcz na tapecie (misja.html linie 1656–1669): czysta logika, rysuje Rain.tsx.
export type Drop = { x: number; y: number; v: number; l: number };

/** Po starcie deszcz pada przez tyle sekund. */
export const FIRST_WAVE = 40;

export function makeDrops(w: number, h: number, rand: () => number): Drop[] {
  return Array.from({ length: Math.floor(w / 7) }, () => ({ x: rand() * w, y: rand() * h, v: 6 + rand() * 8, l: 8 + rand() * 14 }));
}

export function stepDrop(d: Drop, h: number, w: number, rand: () => number): Drop {
  const y = d.y + d.v;
  if (y > h) return { ...d, y: -20, x: rand() * w };
  return { ...d, y, x: d.x - 0.6 };
}

/** Koniec fali: deszcz (1) przechodzi w przerwę 120–300 s, przerwa (0) w deszcz 30–60 s. */
export function nextWave(target: 0 | 1, rand: () => number): { target: 0 | 1; next: number } {
  return target === 1 ? { target: 0, next: 120 + rand() * 180 } : { target: 1, next: 30 + rand() * 30 };
}
