// Zmyślona sieć wieżowca za skrzynką S1: dane gry w pamięci, nic nie wychodzi do sieci.
export type Shape = '◆' | '●' | '■' | '▲' | '◉';
export type ShapeName = 'serwer' | 'komputer' | 'router' | 'drukarka' | 'kamera';
export type TowerNode = { ip: string; sh: Shape; net: string; akt: number[]; kto: string };

/** Aktywność w 24 godzinach: poziom `l` w godzinach [a, b), poza tym `base`. */
export const activity = (a: number, b: number, l = 2, base = 0): number[] =>
  Array.from({ length: 24 }, (_, h) => (h >= a && h < b ? l : base));

const H = activity;

export const TOWER_NODES: TowerNode[] = [
  { ip: '10.42.2.3', sh: '◉', net: '2', akt: H(0, 24, 2), kto: 'kamera nad recepcją, parter' },
  { ip: '10.42.2.8', sh: '●', net: '2', akt: H(6, 21, 2), kto: 'kasa kawiarni Ziarno, parter' },
  { ip: '10.42.5.4', sh: '◆', net: '5', akt: H(0, 24, 2), kto: 'serwer rezerwacji, Hotel Luksus' },
  { ip: '10.42.5.10', sh: '●', net: '5', akt: H(0, 24, 1), kto: 'komputer recepcji, Hotel Luksus' },
  { ip: '10.42.5.17', sh: '■', net: '5', akt: H(0, 24, 1), kto: 'sterownik klimatyzacji, Hotel Luksus' },
  { ip: '10.42.7.5', sh: '●', net: '7', akt: H(8, 18, 2), kto: 'komputer kasjera, sala obsługi' },
  { ip: '10.42.7.6', sh: '●', net: '7', akt: H(8, 18, 2), kto: 'komputer doradcy, sala obsługi' },
  { ip: '10.42.7.12', sh: '◆', net: '7', akt: H(8, 18, 3), kto: 'serwer plików centrali' },
  { ip: '10.42.7.20', sh: '◆', net: '7', akt: H(7, 23, 3, 1), kto: 'bankowość internetowa (strona)' },
  { ip: '10.42.7.31', sh: '◆', net: '7', akt: H(1, 4, 3), kto: 'serwer nocnych kopii' },
  { ip: '10.42.7.44', sh: '◉', net: '7', akt: H(0, 24, 2), kto: 'kamera nad wejściem' },
  { ip: '10.42.9.2', sh: '◆', net: '9', akt: H(8, 18, 3), kto: 'serwer projektów, Data-Tech' },
  { ip: '10.42.9.6', sh: '●', net: '9', akt: H(8, 18, 2), kto: 'komputer programisty, Data-Tech' },
  { ip: '10.42.9.9', sh: '▲', net: '9', akt: H(8, 17, 1), kto: 'drukarka, Data-Tech' },
  { ip: '10.42.12.3', sh: '●', net: '12', akt: H(10, 22, 2), kto: 'komputer grafika, Pixel' },
  { ip: '10.42.12.7', sh: '●', net: '12', akt: H(10, 20, 2), kto: 'komputer montażysty, Pixel' },
  { ip: '10.42.12.11', sh: '◆', net: '12', akt: H(0, 24, 3), kto: 'serwer renderów, Pixel' },
  { ip: '10.42.16.4', sh: '■', net: '16', akt: H(6, 23, 1), kto: 'sterownik bramek wejściowych, FitTower' },
  { ip: '10.42.16.9', sh: '◉', net: '16', akt: H(0, 24, 2), kto: 'kamera na sali ćwiczeń, FitTower' },
  { ip: '10.42.21.5', sh: '■', net: '21', akt: H(17, 24, 2), kto: 'sterownik świateł i nagłośnienia, Panorama' },
  { ip: '10.42.21.8', sh: '●', net: '21', akt: H(12, 24, 2), kto: 'kasa restauracji Panorama' },
];

export const BRANCHES: [net: string, label: string][] = [
  ['2', 'przełącznik A · 10.42.2.x'],
  ['5', 'przełącznik B · 10.42.5.x'],
  ['7', 'przełącznik C · 10.42.7.x'],
  ['9', 'przełącznik D · 10.42.9.x'],
  ['12', 'przełącznik E · 10.42.12.x'],
  ['16', 'przełącznik F · 10.42.16.x'],
  ['21', 'przełącznik G · 10.42.21.x'],
];

export const SHAPES: Record<ShapeName, Shape> = {
  serwer: '◆', komputer: '●', router: '■', drukarka: '▲', kamera: '◉',
};

export const SHAPE_NAMES: Record<Shape, string> = {
  '◆': 'serwer', '●': 'komputer', '■': 'router lub sterownik', '▲': 'drukarka', '◉': 'kamera',
};

export function hoursLabel(n: TowerNode): string {
  const on = n.akt.map((v, h) => (v ? h : -1)).filter((h) => h >= 0);
  if (on.length === 24) return 'cała doba';
  return `${on[0]}–${on[on.length - 1] + 1}`;
}
