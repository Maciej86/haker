import { rng } from '../../engine/rng';
import { advance } from '../../engine/clock';
import { gain } from '../../engine/skills';
import { esc } from '../../engine/text';
import type { GameState, StepResult } from '../../engine/types';
import { andThen, step } from '../../engine/types';
import { KUBA_IP } from './texts';
import type { BakeItem, WytrychAction, WytrychView } from '../../engine/wytrych';
import type { Bake } from './state';
import type { FileEvent } from '../../engine/missions';

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

/** Wypieki z zapisu; starszy zapis bez nich dostaje te same wartości z ziarna. */
const bakeOf = (s: GameState): Bake => s.mission.kuba.bake ?? drawBake(s.seed);

export const KUBA_WYT_TITLE = `Wytrych 1.0 · ${KUBA_IP} (serwer Zenka)`;

/** Widok okna Wytrych w misji 1: „Brak celu” przed `crack`, potem zagadka z wypieków. */
export function kubaWytrychView(s: GameState): WytrychView {
  const k = s.mission.kuba;
  if (!k.open && !k.cracked) return { title: KUBA_WYT_TITLE, mode: 'none' };
  const b = bakeOf(s);
  return {
    title: KUBA_WYT_TITLE,
    mode: 'bake',
    bake: {
      rows: bakeRows(b),
      won: k.cracked,
      answer: k.cracked ? bakeAnswer(b) : null,
      tries: k.tries,
      hints: bakeHints(b).slice(0, k.hints),
      hintsLeft: 3 - k.hints,
      wrong: k.wrong,
    },
  };
}

/** Odpowiedź albo podpowiedź w oknie Wytrych (misja 1). */
export function kubaWytrychAct(s: GameState, a: WytrychAction): StepResult {
  const k = s.mission.kuba;
  if (k.cracked || !k.open) return step(s);
  if (a.kind === 'hint') return step(setKuba(s, { hints: Math.min(3, k.hints + 1), wrong: null }));
  const v = a.value.trim();
  if (!v) return step(s);
  const b = bakeOf(s);
  const tries = k.tries + 1;
  const n = bakeAnswer(b);
  if (Number(v) !== n) {
    const e = esc(v);
    return step(setKuba(s, { bake: b, tries, wrong: e }), [{ html: `<span class="r">Wytrych: hasło ${e} odrzucone.</span>` }]);
  }
  const first = tries === 1 && k.hints === 0;
  const t = advance(setKuba(s, { bake: b, tries, cracked: true, open: false, wrong: null }), 2);
  const next: GameState = {
    ...t,
    stats: { ...t.stats, first: true },
    terminal: { ...t.terminal, location: { kind: 'host', ip: KUBA_IP, path: '~', via: 'direct' } },
  };
  return andThen(
    gain(next, 'Sieć', first ? 0.4 : 0.3, first ? 'hasło złamane za pierwszym razem' : 'pierwsze włamanie Wytrychem'),
    (g) => step(g,
      [{ html: `<span class="c">Hasło złamane: ${n}. Zalogowano na ${KUBA_IP} jako zenek.</span> <span class="d">Pliki: ls</span>` }],
      [{ kind: 'toast', text: 'Dostęp uzyskany · krok „Włamanie” zaliczony' }]),
  );
}

/** Przyrosty i flagi Kuby po poleceniach plikowych na serwerze Zenka. */
export function kubaOnFile(s: GameState, ev: FileEvent): StepResult {
  if (ev.cmd === 'ls') return gain(s, 'Linux', 0.2, 'pierwsze ls na cudzym serwerze');
  if (ev.cmd === 'disconnect') {
    const d = setKuba(s, { disc: true });
    const got = d.downloads.some((f) => f.fileId === `${KUBA_IP}:playlista.txt`);
    return got ? gain(d, 'Linux', 0.3, 'pobranie i czyste rozłączenie') : step(d);
  }
  return step(s);
}
