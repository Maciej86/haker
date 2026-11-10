import { rng } from '../../engine/rng';
import { advance } from '../../engine/clock';
import type { GameState, StepResult } from '../../engine/types';
import { step } from '../../engine/types';
import { KUBA_IP } from './texts';
import type { BakeItem } from '../../engine/wytrych';
import type { Bake } from './state';

export function drawBake(seed: number): Bake {
  const R = rng(seed ^ 0x6b75);
  const r = () => 2 + Math.floor(R() * 5);
  for (;;) {
    const b: Bake = { chleb: r(), bulka: r(), rogal: r() };
    if (new Set([b.chleb, b.bulka, b.rogal]).size === 3 && b.rogal * b.bulka > b.chleb) return b;
  }
}

export const bakeAnswer = (b: Bake): number => b.rogal * b.bulka - b.chleb;

export function bakeRows(b: Bake): { items: BakeItem[]; result: number | null }[] {
  return [
    { items: ['chleb', '+', 'chleb', '+', 'chleb'], result: 3 * b.chleb },
    { items: ['chleb', '+', 'bulka'], result: b.chleb + b.bulka },
    { items: ['bulka', '+', 'bulka', '+', 'rogal'], result: 2 * b.bulka + b.rogal },
    { items: ['rogal', '×', 'bulka', '−', 'chleb'], result: null },
  ];
}

export function bakeHints(b: Bake): [string, string, string] {
  return [
    `Pierwsze równanie ma same chleby: 3 chleby to ${3 * b.chleb}, więc jeden chleb to ${b.chleb}.`,
    `Z drugiego: chleb (${b.chleb}) + bułka = ${b.chleb + b.bulka}, więc bułka to ${b.bulka}. Z trzeciego: ${b.bulka} + ${b.bulka} + rogal = ${2 * b.bulka + b.rogal}.`,
    `Rogal to ${b.rogal}. Ostatnie: ${b.rogal} × ${b.bulka} − ${b.chleb}.`,
  ];
}

const setKuba = (s: GameState, patch: Partial<GameState['mission']['kuba']>): GameState =>
  ({ ...s, mission: { ...s.mission, kuba: { ...s.mission.kuba, ...patch } } });

/** `connect` bez znanego hasła (minuta już naliczona). */
export function kubaConnectLocked(s: GameState): StepResult {
  const tail = s.owned.includes('wyt')
    ? ` <span class="y">Złam hasło: crack ${KUBA_IP}</span>`
    : ' <span class="y">Nie masz narzędzia do łamania haseł. Wytrych kupisz w Darknecie.</span>';
  return step(setKuba(s, { conn: true }), [{
    html: `<span class="d">Łączenie z ${KUBA_IP}…</span>\n<span class="c">zenek-muzyka</span> · serwer domowy · Linux\nlogin: zenek\nhasło: <span class="r">✕ nie znasz hasła. Połączenie zamknięte.</span>\n<span class="d">Podpowiedź do hasła na serwerze: „zagadka z piekarni”.</span>${tail}`,
  }]);
}

/** `crack` na serwerze Zenka: 1 min, otwiera okno Wytrych. */
export function kubaCrack(s: GameState): StepResult {
  const next = setKuba(advance(s, 1), { conn: true, open: true, wrong: null });
  return step(next, [{
    html: `<span class="d">Wytrych 1.0 · cel ${KUBA_IP} · zabezpieczenie: hasło z podpowiedzią</span>\n<span class="c">Podpowiedź Zenka to zagadka. Wynik ostatniego równania jest hasłem.</span> <span class="d">Namierzanie: brak.</span>`,
  }], [{ kind: 'open', app: 'wytrych' }]);
}
