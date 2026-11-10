// Typy danych miast (JSON z scripts/citygen.mjs, zob. npm run gen:cities).

export type SceneKey = 'nt' | 'leszno' | 'centrum' | 'jezyce' | 'winogrady' | 'grunwald' | 'wilda' | 'rataje' | 'lawica';
export type DistrictKey = Exclude<SceneKey, 'nt' | 'leszno'>;
export type CityPlace = SceneKey;

export interface Pt { x: number; y: number }
export interface Tenant { n: string; f: string; h?: 1 }

export interface Box {
  x: number; y: number; w: number; d: number; h: number;
  z0?: number;
  kind: string;
  label?: string;
  tenants?: Tenant[];
  tower?: 1;
  house?: 1;
  home?: 1;
}
export interface Car { x: number; y: number; w: number; d: number; h: number; col: number }
export interface Ground { x: number; y: number; w: number; d: number; kind: string; cross?: 1 }
export interface Street {
  n: string; v: 0 | 1; c: number; w: number;
  main?: boolean; dual?: boolean;
  from?: number; to?: number; short?: 1;
}
export interface Cell { x: number; y: number; w: number; h: number; tpl?: string }
export type Crossing = [number, number, number, number];
export interface Mast { k: string; x: number; y: number; r: number; sec: number }
export interface Source {
  k: string; sec: number; x: number; y: number; w: number; d: number; h: number;
  range: { x: number; y: number; w: number; h: number };
}

export interface Scene {
  key: SceneKey;
  tier: 'small' | 'medium' | 'big';
  W: number; H: number;
  cells: Cell[];
  streets: Street[];
  boxes: Box[];
  trees: Pt[];
  cars: Car[];
  grounds: Ground[];
  crossings: Crossing[];
  masts: Mast[];
  srcs: Source[];
  airport: Pt | null;
  start: Pt;
  startLabel: string | null;
  home: Pt | null;
  targetIndex: number | null;
}

export interface GridLine { c: number; w: number; main: boolean }
export interface CityCell {
  i: number; j: number; x: number; y: number; w: number; h: number;
  d: DistrictKey | null;
  water?: 1; out?: 1; park?: 1;
}
export interface CityBox { x: number; y: number; w: number; d: number; h: number; kind: string; dk: DistrictKey }

export interface CityView {
  W: number; H: number;
  V: GridLine[]; Hs: GridLine[];
  xs: [number, number][]; ys: [number, number][];
  river: [number, number][];
  AIR: { x: number; y: number; w: number; h: number };
  cells: CityCell[];
  boxes: CityBox[];
  dists: Record<DistrictKey, { cx: number; cy: number; n: number }>;
  rail: number;
  dworzec: { x: number; y: number; w: number; d: number; h: number };
  fields: { x: number; y: number; w: number; d: number }[];
  parkTrees: Pt[];
}

export interface TripRoutes {
  rNT: [number, number][];
  rNTcar: [number, number][];
  rPZ: [number, number][];
  rPZcar: [number, number][];
  rPZwalk: [number, number][];
  homeStreet: string;
  s1Street: string;
  parkStreet: string;
  stationStreet: string;
  entryStreet: string;
  targetIndex: number;
  s1: Pt;
}
