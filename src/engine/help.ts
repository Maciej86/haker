import type { GameState, StepResult } from './types';
import { step } from './types';
import { focusMission, missionDef } from './missions';
import { isLinkedToS1 } from './commands/basic';

export type HelpEntry = { cmd: string; desc: string; cost: string; insert?: string };
export type HelpGroup = {
  title: string;
  unlocked: (s: GameState) => boolean;
  entries: HelpEntry[];
  need?: string;
};

export const HELP_INTRO =
  'Polecenia wpisujesz w Terminalu. „Wpisz” wstawia przykład do Terminala, zatwierdzasz Enterem.';

export const BASE_HELP: HelpGroup[] = [
  {
    title: 'Podstawowe',
    unlocked: () => true,
    entries: [
      { cmd: 'help', desc: 'lista poleceń w Terminalu', cost: '' },
      { cmd: 'whoami', desc: 'twój pseudonim', cost: '' },
      { cmd: 'clear', desc: 'czyści ekran Terminala', cost: '' },
      { cmd: 'notes', desc: 'otwiera Notatki z rozpoznania', cost: '' },
    ],
  },
  {
    title: 'Urządzenia w terenie',
    unlocked: () => true,
    entries: [
      { cmd: 'devices', desc: 'lista twoich urządzeń, ich miejsca i zapas pracy', cost: '' },
      { cmd: 'use S1', desc: 'łączy z urządzeniem przy skrzynce S1', cost: '2 min gry · 1 min urządzenia' },
      { cmd: 'status', desc: 'stan połączenia z urządzeniem', cost: '' },
    ],
  },
  {
    title: 'Rozpoznanie sieci',
    need: 'po połączeniu z urządzeniem',
    unlocked: (s) => isLinkedToS1(s) || s.net.scanned,
    entries: [
      { cmd: 'scan', desc: 'skanuje sieć za skrzynką i otwiera NetMap', cost: '3 min gry · 2 min urządzenia' },
      { cmd: 'scan --net 10.42.7', desc: 'pokazuje tylko jedną podsieć', cost: 'za darmo' },
      { cmd: 'scan --type serwer', desc: 'tylko dany kształt: serwer, komputer, router, drukarka, kamera', cost: 'za darmo' },
      { cmd: 'scan --off 18-24', desc: 'tylko urządzenia wyłączone w tych godzinach', cost: 'za darmo' },
      { cmd: 'probe 10.42.7.12', desc: 'sprawdza, czym naprawdę jest urządzenie', cost: '6 min gry · 3 min urządzenia' },
      { cmd: 'route bank', desc: 'trasa twojego ruchu do banku (wymaga konta klienta)', cost: '2 min gry' },
    ],
  },
];

export const PROGS: [string, string][] = [
  ['Terminal', 'tu wykonujesz wszystkie akcje: łączysz się, skanujesz, sprawdzasz, włamujesz się'],
  ['NetMap', 'rysuje wynik scan jako schemat; przyciski wpisują polecenia do Terminala'],
  ['Notatki', 'wiedza z rozpoznania: maile, telefony, konto klienta'],
  ['Poczta', 'zlecenia; „Odpowiedz” wysyła wynik z załącznikiem z folderu Pobrane'],
  ['Przeglądarka', 'sklep ze sprzętem, łączem i modułami NetMap; konta klienta'],
  ['Darknet', 'narzędzia od innych graczy'],
  ['Ściąga', 'ten spis'],
];

export const WYTRYCH_PROG: [string, string] = [
  'Wytrych',
  'łamie hasła; uruchamia go polecenie crack. W każdym miejscu łamigłówka może wyglądać inaczej',
];

export type HelpGroupView = { group: HelpGroup; unlocked: boolean; isNew: boolean; key: string };

export function helpGroups(s: GameState): HelpGroupView[] {
  const m = focusMission(s);
  const def = m ? missionDef(m) : undefined;
  const groups = def ? (def.helpReplacesBase ? def.help : [...BASE_HELP, ...def.help]) : BASE_HELP;
  return groups.map((group) => {
    const unlocked = group.unlocked(s);
    return { group, unlocked, isNew: unlocked && group.need !== undefined, key: `${m ?? 'base'}:${group.title}` };
  });
}

export function helpInsert(e: HelpEntry): string {
  return e.insert ?? e.cmd.replace(/&lt;[^&]*&gt;/g, '');
}

export function progsFor(s: GameState): [string, string][] {
  const m = focusMission(s);
  const hidden = m ? (missionDef(m).hidePrograms ?? []) : [];
  const list = PROGS.filter((p) => !hidden.includes(p[0]));
  return s.owned.includes('wyt') ? [...list, WYTRYCH_PROG] : list;
}

export function helpBadge(s: GameState): boolean {
  return helpGroups(s).some((g) => g.isNew && !s.helpSeen.includes(g.key));
}

export function markHelpSeen(s: GameState): GameState {
  const add = helpGroups(s).filter((g) => g.isNew && !s.helpSeen.includes(g.key)).map((g) => g.key);
  return add.length === 0 ? s : { ...s, helpSeen: [...s.helpSeen, ...new Set(add)] };
}

export function typeInTerminal(s: GameState, cmd: string): StepResult {
  return step(s, [], [{ kind: 'typeInTerminal', cmd }]);
}
