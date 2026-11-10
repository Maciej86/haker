export type Bake = { chleb: number; bulka: number; rogal: number };
export type KubaState = {
  conn: boolean; open: boolean; cracked: boolean;
  tries: number; hints: number; wrong: string | null; // ostatnia zła odpowiedź (już po esc)
  disc: boolean;                                       // rozłączył się z serwerem
  bake: Bake | null;                                   // losowane przy przyjęciu
};
export function initKubaState(): KubaState {
  return { conn: false, open: false, cracked: false, tries: 0, hints: 0, wrong: null, disc: false, bake: null };
}
