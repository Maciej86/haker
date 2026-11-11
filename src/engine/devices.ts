import type { Device, GameState, Line, StepResult, UiEvent } from './types';
import { andThen, step } from './types';
import { advance, gclk } from './clock';
import { focusMission, missionDef } from './missions';
import { isLinkedToS1 } from './commands/basic';
import { hasPackage } from './trip';
import { realtimeSources } from './realtime';
import type { RealtimeSource } from './realtime';
import { registerBuyHandler } from './buyHandlers';
import { closeSession, endSession } from './server';

export const BUG_MAX = 60;
export const BUG_PRICE = 150;
export const TRIP_AGAIN = { minutes: 110, cost: 58 };

/** PODSŁUCH-1 przy S1, a bez niego ten z plecaka. */
export function bug(s: GameState): Device | undefined {
  return s.devices.find((d) => d.id === 'bug1' && d.where === 'S1')
    ?? s.devices.find((d) => d.id === 'bug1' && d.where === 'plecak');
}

/** Podsłuch przy S1 z zapasem > 0. */
export function bugAtS1(s: GameState): boolean {
  return s.devices.some((d) => d.id === 'bug1' && d.where === 'S1' && d.minutes > 0);
}

/** Odejmuje minuty podsłuchu przy S1; po wyczerpaniu zrywa połączenie z siecią za S1. */
export function useDevice(s: GameState, min: number): StepResult {
  const dev = s.devices.find((d) => d.id === 'bug1' && d.where === 'S1');
  if (!dev || dev.minutes === 0) return step(s);
  const minutes = Math.max(0, dev.minutes - min);
  let n: GameState = {
    ...s,
    devices: s.devices.map((d) => (d === dev ? { ...d, minutes } : d)),
  };
  if (minutes > 0) return step(n);
  if (isLinkedToS1(n)) {
    n = closeSession({ ...n, terminal: { ...n.terminal, location: { kind: 'home' } } });
  }
  const def = missionDef(focusMission(s));
  const lines: Line[] = [
    { html: '<span class="r">PODSŁUCH-1 wyczerpany. Połączenie z siecią za S1 zerwane.</span>' },
    { html: `<span class="d">${def?.deviceDeadText ?? 'Misja trwa.'}</span>` },
  ];
  const ui: UiEvent[] = [
    { kind: 'toast', text: 'PODSŁUCH-1 wyczerpany', bad: true },
    { kind: 'stopTimer', timer: 'download' },
    { kind: 'stopTimer', timer: 'crackTrace' },
  ];
  return step(n, lines, ui);
}

/** Czas gry i minuty urządzenia naraz (advance + useDevice, żeby zerwanie dało linie). */
export function spend(s: GameState, gameMin: number, deviceMin: number): StepResult {
  return andThen(step(advance(s, gameMin)), (x) => useDevice(x, deviceMin));
}

/** Podsłuch przy S1 (martwy albo z resztką zapasu) i nowy w plecaku: można jechać i go podmienić. */
export function bugTripOffer(s: GameState): boolean {
  return s.devices.some((d) => d.id === 'bug1' && d.where === 'S1') && hasPackage(s);
}

/** Zapas podsłuchu wiszącego przy S1 (0 przy martwym), null bez podsłuchu przy S1. */
export function bugAtS1Minutes(s: GameState): number | null {
  return s.devices.find((d) => d.id === 'bug1' && d.where === 'S1')?.minutes ?? null;
}

/** Zakup (pieniądze odejmuje sklep): nowy podsłuch do plecaka. */
export function buyBug(s: GameState): StepResult {
  if (hasPackage(s)) {
    return step(s, [], [{ kind: 'toast', text: 'Masz już nowy PODSŁUCH-1 w plecaku.', bad: true }]);
  }
  const n: GameState = { ...s, devices: [...s.devices, { id: 'bug1', where: 'plecak', minutes: BUG_MAX }] };
  if (!missionDef(focusMission(s))?.network) return step(n);
  return step(n, [{
    html: '<span class="c">Kupiono PODSŁUCH-1.</span> <span class="d">Paczkomat obok domu.</span>',
  }], [{ kind: 'open', app: 'terminal' }]);
}

/** Skrót drugiego wyjazdu: nowy podsłuch z plecaka zastępuje ten przy S1 (martwy albo z resztką zapasu). */
export function tripAgain(before: GameState): StepResult {
  if (!bugTripOffer(before)) return step(before);
  if (before.money < TRIP_AGAIN.cost) {
    return step(before, [], [{ kind: 'toast', text: `Brakuje ${TRIP_AGAIN.cost - before.money} ¤ na dojazd.`, bad: true }]);
  }
  const carried = before.devices.find((d) => d.id === 'bug1' && d.where === 'plecak')!;
  const old = bugAtS1Minutes(before) ?? 0;
  // Wymiana żywego podsłuchu: najpierw koniec sesji (pobieranie, Wytrych, łącze S1), jak przy zerwaniu.
  const end = endSession(before);
  const s = end.state;
  const adv = advance(s, TRIP_AGAIN.minutes);
  const n: GameState = {
    ...adv,
    money: s.money - TRIP_AGAIN.cost,
    devices: [
      ...s.devices.filter((d) => d.id !== 'bug1'),
      { ...carried, where: 'S1', minutes: BUG_MAX },
    ],
    terminal: { ...s.terminal, location: { kind: 'home' } },
  };
  const def = missionDef(focusMission(s));
  const swap = old > 0 ? ` <span class="d">Stary miał jeszcze ${old} min.</span>` : '';
  return step(n, [{
    html: `<span class="c">${gclk(n)} · wróciłeś. Nowy PODSŁUCH-1 podpięty w szafce przy S1.</span>${swap}${def?.bugReplacedText ? ` <span class="d">${def.bugReplacedText}</span>` : ''}`,
  }], end.ui);
}

/** Dopisek etapu wyjazdu, gdy misja ruszyła z żywym podsłuchem przy S1. */
export function reusedBugSub(s: GameState): string | null {
  return s.net.reusedBug ? 'pominięte: PODSŁUCH-1 już wisiał przy S1' : null;
}

/** Paczka zleceniodawcy jeszcze na przystanku: misja z wyjazdem, przed udanym wyjazdem, bez sprzętu. */
export function packageWaiting(s: GameState): boolean {
  const def = missionDef(s.active);
  return !!def?.trip
    && !s.net.reusedBug
    && !(s.trip.mission === s.active && s.trip.last === 'ok')
    && !hasPackage(s)
    && !bugAtS1(s);
}

const S1_STEP_MS = 10_000;

/** Połączenie z S1: co 10 s czasu rzeczywistego 1 min gry i 1 min urządzenia (misja.html linia 1413). */
export const S1_SOURCE: RealtimeSource = {
  id: 's1',
  active: (s) =>
    s.screen === 'desktop'
    && s.overlay === null
    && !s.failed
    && isLinkedToS1(s)
    && bugAtS1(s)
    && !realtimeSources(s).some((r) => r.pausesS1 && r.active(s)),
  tick: (s, ms) => s1Minutes(s, ms),
};

/** Minuty połączenia z S1: co 10 s czasu rzeczywistego 1 min gry i 1 min urządzenia, licznik `net.s1Ms`
 * wspólny dla `'s1'` i źródeł z `pausesS1`, które liczą minuty same (Wytrych, pobieranie). */
export function s1Minutes(s: GameState, ms: number): StepResult {
  let acc = s.net.s1Ms + ms;
  let r: StepResult = step(s);
  while (acc >= S1_STEP_MS && isLinkedToS1(r.state) && bugAtS1(r.state)) {
    acc -= S1_STEP_MS;
    r = andThen(r, (x) => spend(x, 1, 1));
  }
  const s1Ms = isLinkedToS1(r.state) && bugAtS1(r.state) ? acc : 0;
  return { ...r, state: { ...r.state, net: { ...r.state.net, s1Ms } } };
}

registerBuyHandler('pods', buyBug, (s) => (hasPackage(s) ? 'Masz już nowy PODSŁUCH-1 w plecaku.' : null));
