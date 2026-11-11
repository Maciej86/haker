import type { TowerNode } from '../../world/tower';
import { activity } from '../../world/tower';

/** Kamery 7. piętra Hotelu Luksus w podsieci .5 (makieta linie 990–993); tylko w nakładce sieci L. */
export const M3_CAMS: TowerNode[] = [
  { ip: '10.42.5.31', sh: '◉', net: '5', akt: activity(0, 24, 2), kto: 'kamera, p. 7, przy windzie (Hotel Luksus)' },
  { ip: '10.42.5.32', sh: '◉', net: '5', akt: activity(0, 24, 2), kto: 'kamera, p. 7, korytarz A (Hotel Luksus)' },
  { ip: '10.42.5.33', sh: '◉', net: '5', akt: activity(0, 24, 2), kto: 'kamera, p. 7, korytarz B (Hotel Luksus)' },
  { ip: '10.42.5.34', sh: '◉', net: '5', akt: activity(0, 24, 2), kto: 'kamera, p. 7, klatka schodowa (Hotel Luksus)' },
];

/** Kamery z drogi winda → korytarz B → 712: przy windzie i korytarz B. */
export const M3_ROUTE: string[] = ['10.42.5.31', '10.42.5.33'];

/** Kamera z 7. piętra (makieta linia 1013). */
export function isFloorCam(kto: string): boolean {
  return /p\. 7/.test(kto);
}
