// Duży zegar zlecenia L. i „⏩ Przewiń” (makieta linie 1809–1825).
import type { GameState, StepResult } from '../../engine/types';
import { andThen, step } from '../../engine/types';
import type { ClockNote, ClockView } from '../../engine/missions';
import { hhmm } from '../../engine/clock';
import { fill } from '../../engine/text';
import { runLine } from '../../engine/terminal';
import { isLinkedToS1 } from '../../engine/commands/basic';
import { CAM_MAX, offAt, type M3State } from './state';
import { atReady, manualOff } from './window';
import { m3Live } from './live';
import { deadBug, m3BugTooLate, m3NextWindow, m3StageIndex } from './logic';
import { TRIP_AGAIN } from '../../engine/devices';
import { dur } from '../../engine/clock';
import {
  M3_BACK_LIVE, M3_BACK_LIVE_CONNECT, M3_CLOCK_BUG_DEAD, M3_CLOCK_BUG_LATE, M3_CLOCK_BACK, M3_CLOCK_BLOCK, M3_CLOCK_DISCONNECT, M3_CLOCK_JUMP, M3_CLOCK_LIVE, M3_CLOCK_LIVE_AT, M3_CLOCK_LIVE_CONNECT,
  M3_CLOCK_LIVE_NOW, M3_CLOCK_LIVE_TAG, M3_CLOCK_LIVE_WAIT, M3_CLOCK_MANUAL, M3_CLOCK_QUIET, M3_CLOCK_READY, M3_CLOCK_RUNNING,
  M3_CLOCK_WAIT_L, M3_CLOCK_WARN, M3_CLOCK_WARN_AT, M3_CLOCK_WARN_MAN, M3_CLOCK_WIN,
} from './texts';

/** Sekundy jako „1:14:00”, „2:30” (linia 1809). */
export function hms(x: number): string {
  x = Math.max(0, Math.round(x));
  const h = Math.floor(x / 3600), m = Math.floor((x % 3600) / 60), sec = x % 60;
  return (h ? h + ':' + String(m).padStart(2, '0') : String(m)) + ':' + String(sec).padStart(2, '0');
}

/** „⚠ wyłączone: …” (linie 1810–1811), bez początkowego `<br>`; pusty napis, gdy wszystko działa. */
export function camWarn(m: M3State, t: number): string {
  const list = offAt(m, t);
  if (!list.length) return '';
  return fill(M3_CLOCK_WARN, {
    lista: list.map((c) => {
      const n = c.ip.split('.').pop()!;
      return c.on !== null && c.on <= c.off + CAM_MAX
        ? fill(M3_CLOCK_WARN_AT, { n, hm: hhmm(c.on) })
        : fill(M3_CLOCK_WARN_MAN, { n, hm: hhmm(c.off + CAM_MAX) });
    }).join(', '),
  });
}

const blockNote = (): ClockNote => ({ tone: 'red', html: fill(M3_CLOCK_BLOCK, { max: String(CAM_MAX) }) });

/** Cel przycisku: 1 min przed oknem przy gotowych zadaniach `at`, 4 min przy drodze ręcznej (linia 1821). */
function jumpTarget(m: M3State): number {
  return atReady(m) ? m.win.start - 1 : m.win.start - 4;
}

/** Widok dużego zegara (linie 1814–1824) albo null poza oknem czasowym zlecenia.
 * Martwy podsłuch: czerwona uwaga; bez „Przewiń”, dopóki nowy zdąży przed oknem (przewinięcie zjadłoby czas na wyjazd). */
export function m3ClockView(s: GameState): ClockView | null {
  const v = clockView(s);
  if (!v || !deadBug(s)) return v;
  const jazda = dur(TRIP_AGAIN.minutes);
  if (m3BugTooLate(s)) return { ...v, note: { tone: 'red', html: fill(M3_CLOCK_BUG_LATE, { hm: hhmm(m3NextWindow(s)), jazda }) } };
  return { ...v, jump: null, note: { tone: 'red', html: fill(M3_CLOCK_BUG_DEAD, { jazda }) } };
}

function clockView(s: GameState): ClockView | null {
  const m = s.mission.m3;
  if (s.active !== 'm3' || s.failed || m.fail || m.ok || m3StageIndex(s) < 2) return null;
  const time = `${hhmm(s.t)}:${String(s.sec).padStart(2, '0')}`;
  const live = m3Live(s);
  const warn = camWarn(m, s.t);
  const withWarn = (html: string) => (warn ? html + '<br>' + warn : html);
  const blocked = manualOff(m, s.t).length > 0;
  const linked = isLinkedToS1(s);

  if (m.leg === 2 && !m.noticed) {
    return {
      time, live,
      html: withWarn(M3_CLOCK_BACK),
      jump: blocked ? null : M3_CLOCK_WAIT_L,
      note: blocked ? blockNote() : { tone: 'dim', html: linked ? M3_CLOCK_DISCONNECT : M3_CLOCK_QUIET },
    };
  }

  const w = m.win;
  const left = w.start * 60 - (s.t * 60 + s.sec);
  const html = withWarn(left > 0
    ? fill(M3_CLOCK_WIN, { od: hhmm(w.start), do: hhmm(w.start + w.len), za: hms(left), żywo: live ? M3_CLOCK_LIVE_TAG : '' })
    : fill(M3_CLOCK_RUNNING, { do: hhmm(w.start + w.len) }));
  const jobs = atReady(m);
  if (m.leg === 1 && s.t < jumpTarget(m)) {
    if (blocked) return { time, html, live, jump: null, note: blockNote() };
    const why = jobs ? M3_CLOCK_READY : fill(M3_CLOCK_MANUAL, { hm: hhmm(w.start - 1) });
    return {
      time, html, live,
      jump: fill(M3_CLOCK_JUMP, { hm: hhmm(jumpTarget(m)) }),
      note: { tone: 'dim', html: why + (linked ? ' ' + M3_CLOCK_DISCONNECT : '') },
    };
  }
  if (live) {
    const back = m.leg === 2;
    const co = jobs ? M3_CLOCK_LIVE_AT
      : linked ? (s.t < w.start - 1 ? fill(M3_CLOCK_LIVE_WAIT, { hm: hhmm(w.start - 1) }) : M3_CLOCK_LIVE_NOW)
      : back ? M3_BACK_LIVE_CONNECT : M3_CLOCK_LIVE_CONNECT;
    const note = back ? fill(M3_BACK_LIVE, { hm: hhmm(w.start), co }) : fill(M3_CLOCK_LIVE, { co });
    return { time, html, live, jump: null, note: { tone: 'text', html: note } };
  }
  return { time, html, live, jump: null, note: null };
}

/** „⏩ Przewiń” (linia 1825): rozłącza z S1 (zapas nie maleje), przewija `wait` do celu, otwiera Terminal. */
export function m3Jump(s: GameState): StepResult {
  if (!m3ClockView(s)?.jump) return step(s);
  const m = s.mission.m3;
  const back = m.leg === 2 && !m.noticed;
  const tgt = back ? m.notice : jumpTarget(m);
  if (tgt === null || tgt <= s.t) return step(s); // etap 2 bez minuty wiadomości albo po niej: bez celu z etapu 1
  let r = step(s);
  for (let i = 0; i < 2 && isLinkedToS1(r.state); i++) r = andThen(r, (x) => runLine(x, 'disconnect'));
  r = andThen(r, (x) => runLine(x, 'wait ' + hhmm(tgt)));
  return { ...r, state: { ...r.state, sec: 0 }, ui: [...r.ui, { kind: 'open', app: 'terminal' }] };
}
