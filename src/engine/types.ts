import type { KubaState } from '../missions/kuba/state';
import type { WState } from '../missions/w/state';
import type { M3State } from '../missions/m3/state';
import type { NetState } from './network';
import type { TripState } from './trip';

export type MissionId = 'kuba' | 'w' | 'm3';
export type Day = 'pon' | 'wt' | 'śr' | 'czw' | 'pt' | 'sob' | 'nd';
export type Skill = 'Sieć' | 'Linux' | 'Skrypty' | 'Social';
export type Screen = 'desktop' | 'mapPoland' | 'mapCity' | 'trip';
export type Overlay = null | 'summary' | 'end';
export type AppId = 'terminal' | 'mail' | 'notes' | 'help' | 'netmap' | 'wytrych'
  | 'browser' | 'darknet' | 'achievements' | 'downloads' | 'plan' | 'clock';

export type Line = { html: string };
export type Location =
  | { kind: 'home' }                               // prompt '>'
  | { kind: 'host'; ip: string; path: string; via: 'direct' | 'S1' } // 'zenek:~ >' albo '10.42.7.12:/ścieżka >'
  | { kind: 'S1' };                                // 'S1 >'

export type Device = { id: 'bug1'; where: 'S1' | 'plecak'; minutes: number }; // PODSŁUCH-1, zapas 0..60
export type FileRef = { name: string; size: string; mission: MissionId; host: string; fileId: string };
export type MailMsg = { from: string; when: string; html: string; bad?: boolean; attachment?: string };
export type MailState = {
  read: string[];                       // id wątków przeczytanych
  threads: Record<string, MailMsg[]>;   // id wątku = MissionId oferty
  hidden: string[];
  draft: Record<string, string>;        // treść pola odpowiedzi
};
export type Gain = { sk: Skill; v: number; why: string };
export type SummaryRow = { label: string; value: string; tone?: 'ok' | 'bad' | 'dim' | 'coin' };

export type SummaryMeta = { log: string[]; xp: number; money: number; next: 'nextDay' | 'end' | 'retry' };

export type GameState = {
  version: 1;
  seed: number;
  screen: Screen;
  overlay: Overlay;
  mapCityTab: 'nt' | 'leszno' | 'poznan'; mapCityDistrict: string | null; // co pokazać po wejściu na mapCity
  day: Day;
  t: number;                 // minuty od północy
  sec: number;               // sekundy w trybie „na żywo” (0..59)
  money: number; xp: number; lvl: number;
  skills: Record<Skill, number>;
  gains: Gain[];
  owned: string[];
  hw: { cpu: number; ram: number; net: number; netName: string };
  done: MissionId[];
  active: MissionId | null;
  devices: Device[];
  mail: MailState;
  downloads: FileRef[];
  terminal: { lines: Line[]; history: string[]; location: Location };
  mission: { kuba: KubaState; w: WState; m3: M3State }; // typy z src/missions/<id>/state.ts
  dayCheckpoint: Omit<GameState, 'dayCheckpoint'> | null;
  stats: { scans: number; buys: number; first: boolean };
  net: NetState;             // wspólny stan rozpoznania sieci za S1 (plan 05)
  trip: TripState;           // wspólny stan wyjazdu (plan 04)
  summary: SummaryRow[] | null; // wiersze bieżącego overlayu summary
  failed: boolean;           // misja przegrana, overlay summary pokazuje „Spróbuj od nowa”
  summaryMeta: SummaryMeta | null;
  helpSeen: string[];
};

export type UiEvent =
  | { kind: 'toast'; text: string; bad?: boolean }
  | { kind: 'gain'; sk: Skill; v: number; why: string }      // dymek „+0,3 Linux · za co” i błysk paska
  | { kind: 'open'; app: AppId }
  | { kind: 'typeInTerminal'; cmd: string }                  // przycisk w programie wpisuje polecenie
  | { kind: 'startTimer'; timer: TimerKind }                 // pobieranie, Wytrych z namierzaniem
  | { kind: 'stopTimer'; timer: TimerKind }
  | { kind: 'mailArrives'; thread: MissionId; msg: MailMsg; delayMs: number } // odpowiedź zleceniodawcy „po chwili”
  /** Krótkie wstrzymanie Terminala (makieta: `get`): pole wyłączone, pasek `bar` rośnie w `steps` krokach przez `ms`.
   * Linie `after` są już w stanie (zapis spójny po odświeżeniu) — Terminal tylko ukrywa je do końca wstrzymania,
   * potem pokazuje toast. To nie `startTimer 'download'` (to pobieranie z banku, z procentami). */
  | { kind: 'termHold'; ms: number; steps: number; bar: Line; after: Line[]; toast?: string };

export type TimerKind = 'download' | 'crackTrace';
export type StepResult = { state: GameState; lines: Line[]; ui: UiEvent[] };
export const step = (state: GameState, lines: Line[] = [], ui: UiEvent[] = []): StepResult => ({ state, lines, ui });

/** (Nie `then`: moduł z eksportem `then` jest traktowany jak thenable przez dynamiczny import.)
 * Skleja wynik `r` z krokiem `f` wykonanym na jego stanie: linie i zdarzenia UI się sumują, stan z `f`. */
export const andThen = (r: StepResult, f: (s: GameState) => StepResult): StepResult => {
  const n = f(r.state);
  return { state: n.state, lines: [...r.lines, ...n.lines], ui: [...r.ui, ...n.ui] };
};
