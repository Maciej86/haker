// Rzut mapy Polski: proste równoleżnikowe z korektą cos 52°, jak w makiecie (mapa-polski.tpl.html, linia 95).
export const K = 100;
export const CL = Math.cos((52 * Math.PI) / 180);

export function pj(lo: number, la: number): [number, number] {
  return [(lo - 12) * CL * K, (55.6 - la) * K];
}
