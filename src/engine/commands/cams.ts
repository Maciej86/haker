// Polecenia kamer dla misji czasowych: cam, at, wait (mockups/misja.html linie 1773–1797).
// Fabryka: parsuje argumenty, sprawdza połączenie z S1 i znajomość urządzenia; zapis na osi kamer robią hooki misji.
// Tabela trafia do `commands` misji, nie do BASE_COMMANDS. Teksty bez porad (Terminal nie podpowiada).
import type { CommandTable } from '../terminal';
import type { GameState, Line, StepResult } from '../types';
import { andThen, step } from '../types';
import { advance, dur, gclk } from '../clock';
import { esc, fill } from '../text';
import { bug, useDevice } from '../devices';
import { netNodes } from '../network';
import { isLinkedToS1 } from './basic';

export type CamJob = { ip: string; off: number; min: number };
export type CamHooks = {
  max: number;
  isOff(s: GameState, ip: string): boolean;
  /** Ręcznie od s.t. */
  off(s: GameState, ip: string): GameState;
  on(s: GameState, ip: string): GameState;
  addJob(s: GameState, job: CamJob): GameState;
  jobs(s: GameState): CamJob[];
  /** Dopisek misji po `at`. */
  afterAt(s: GameState): Line[];
  /** Podsłuch padł: zadania od tej minuty przepadają. */
  lost(s: GameState, from: number): StepResult;
  /** Ocena po każdym poleceniu. */
  after(s: GameState): StepResult;
};

/** Linia 1776. */
export const CAM_USAGE = 'Użycie: cam off &lt;ip&gt; · cam on &lt;ip&gt;';
/** Linia 1777 bez „Najpierw: use S1”. */
export const CAM_NO_LINK = '<span class="r">Brak połączenia.</span>';
/** Spec 05 „Podsłuch się wyczerpał” (makieta tego nie ma). */
export const CAM_DEAD = '<span class="r">Brak połączenia z S1: PODSŁUCH-1 wyczerpany.</span>';
/** Linia 1778 bez „Najpierw: scan”. Wstawka {ip}. */
export const CAM_UNKNOWN = '<span class="r">Nie znasz urządzenia {ip}.</span>';
/** Linia 1779. Wstawki {ip}, {sh}. */
export const CAM_NOT_CAM = '<span class="r">{ip} to nie kamera (kształt {sh}).</span>';
/** Linia 1780 bez „włącz ją najpóźniej o … (cam on …)”. Wstawki {ip}, {max}. */
export const CAM_ALREADY_OFF = '<span class="d">{ip} już wyłączona.</span>';
export const CAM_OFF_LINE = '<span class="y">{czas} · kamera {ip} wyłączona.</span> <span class="d">Ochrona widzi „brak sygnału”. Po {max} min awarii idzie sprawdzić.</span>';
/** Linia 1781. */
export const CAM_ALREADY_ON = '<span class="d">{ip} działa.</span>';
export const CAM_ON_LINE = '<span class="c">{czas} · kamera {ip} znowu działa.</span>';
/** Linia 1784. */
export const AT_EMPTY = '<span class="d">Brak zadań.</span>';
/** Linia 1786. */
export const AT_USAGE = 'Użycie: at 21:14 cam off &lt;ip&gt; 3m';
/** Linia 1787 bez „Najpierw: use S1”. */
export const AT_NO_LINK = '<span class="r">Zadanie zapisuje się na PODSŁUCHU-1.</span>';
/** Linia 1788. Wstawka {ip}. */
export const AT_NOT_CAM = '<span class="r">{ip} to nie znana kamera.</span>';
/** Linie 1789, 1795. */
export const PAST = '<span class="r">Ta godzina już minęła.</span>';
/** Linia 1790. Wstawka {max}. */
export const AT_RANGE = '<span class="r">Czas od 1m do {max}m. Dłuższą awarię ochrona sprawdzi.</span>';
/** Linia 1792 bez „Lista: at”. Wstawki {czas}, {ip}, {min}. */
export const AT_SAVED = '<span class="c">Zadanie zapisane na PODSŁUCHU-1:</span> {czas} cam off {ip} na {min} min. <span class="d">Wykona się także po rozłączeniu.</span>';
/** Linia 1794. */
export const WAIT_USAGE = 'Użycie: wait 21:10 (czekasz do tej godziny)';
/** Linia 1797. Wstawki {czas}, {ile}; {zapas} w drugiej części. */
export const WAIT_LINE = '<span class="d">Czekasz do {czas} ({ile}).</span>';
export const WAIT_LINKED = ' <span class="y">PODSŁUCH-1 był cały czas połączony: −{zapas} min zapasu.</span>';

/** HH:MM → minuty dnia (tparse, linia 1773). */
export function parseHm(arg: string | undefined): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(arg ?? '');
  if (!m || +m[1] >= 24 || +m[2] >= 60) return null;
  return +m[1] * 60 + +m[2];
}

const say = (s: GameState, html: string): StepResult => step(s, [{ html }]);

/** Brak połączenia: przy wyczerpanym podsłuchu przy S1 osobny tekst. */
function noLink(s: GameState, html: string): StepResult {
  const dead = s.devices.some((d) => d.id === 'bug1' && d.where === 'S1' && d.minutes === 0);
  return say(s, dead ? CAM_DEAD : html);
}

function knownNode(s: GameState, ip: string) {
  return s.net.scanned ? netNodes(s).find((n) => n.ip === ip) : undefined;
}

export function camCommands(h: CamHooks): CommandTable {
  return {
    cam: ([op, ip], s) => {
      if ((op !== 'off' && op !== 'on') || !ip) return say(s, CAM_USAGE);
      if (!isLinkedToS1(s)) return noLink(s, CAM_NO_LINK);
      const n = knownNode(s, ip);
      if (!n) return say(s, fill(CAM_UNKNOWN, { ip: esc(ip) }));
      if (n.sh !== '◉') return say(s, fill(CAM_NOT_CAM, { ip: esc(ip), sh: n.sh }));
      const vars = { ip: esc(ip), czas: gclk(s), max: String(h.max) };
      if (op === 'off') {
        if (h.isOff(s, ip)) return say(s, fill(CAM_ALREADY_OFF, vars));
        return andThen(say(h.off(s, ip), fill(CAM_OFF_LINE, vars)), h.after);
      }
      if (!h.isOff(s, ip)) return say(s, fill(CAM_ALREADY_ON, vars));
      return andThen(say(h.on(s, ip), fill(CAM_ON_LINE, vars)), h.after);
    },
    at: (args, s) => {
      const p = args.filter(Boolean);
      if (!p.length) {
        const j = h.jobs(s);
        if (!j.length) return say(s, AT_EMPTY);
        return step(s, j.map((c, i) => ({ html: `${i + 1}. ${gclk(s, c.off)}  cam off ${esc(c.ip)}  ${c.min}m` })));
      }
      const t = parseHm(p[0]);
      const ip = p[3];
      const d = /^(\d+)m$/.exec(p[4] ?? '');
      if (t === null || p[1] !== 'cam' || p[2] !== 'off' || !ip || !d) return say(s, AT_USAGE);
      if (!isLinkedToS1(s)) return noLink(s, AT_NO_LINK);
      if (knownNode(s, ip)?.sh !== '◉') return say(s, fill(AT_NOT_CAM, { ip: esc(ip) }));
      if (t <= s.t) return say(s, PAST);
      const min = +d[1];
      if (min < 1 || min > h.max) return say(s, fill(AT_RANGE, { max: String(h.max) }));
      const n = advance(h.addJob(s, { ip, off: t, min }), 1);
      const lines: Line[] = [{ html: fill(AT_SAVED, { czas: gclk(s, t), ip: esc(ip), min: String(min) }) }, ...h.afterAt(n)];
      return andThen(step(n, lines), h.after);
    },
    wait: ([arg], s) => {
      const t = parseHm(arg);
      if (t === null) return say(s, WAIT_USAGE);
      if (t <= s.t) return say(s, PAST);
      const t0 = s.t;
      const dt = t - t0;
      const linked = isLinkedToS1(s);
      const zapas = linked ? (bug(s)?.minutes ?? 0) : 0;
      const n: GameState = { ...advance(s, dt), sec: 0 };
      let html = fill(WAIT_LINE, { czas: gclk(s, t), ile: dur(dt) });
      if (linked) html += fill(WAIT_LINKED, { zapas: String(Math.min(dt, zapas)) });
      let r: StepResult = step(n, [{ html }]);
      if (linked) {
        const lost = zapas < dt ? h.lost(n, t0 + zapas) : step(n);
        const used = useDevice(lost.state, dt);
        r = { state: used.state, lines: [...r.lines, ...used.lines, ...lost.lines], ui: [...used.ui, ...lost.ui] };
      }
      return andThen(r, h.after);
    },
  };
}
