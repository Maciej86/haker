import type { Device, GameState, Line, StepResult, UiEvent } from './types';
import { andThen, step } from './types';
import { advance, gclk } from './clock';
import { focusMission, missionDef } from './missions';
import { isLinkedToS1 } from './commands/basic';
import { hasPackage } from './trip';

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
  if (isLinkedToS1(n)) n = { ...n, terminal: { ...n.terminal, location: { kind: 'home' } } };
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

/** Martwy podsłuch przy S1 i nowy w plecaku: można jechać drugi raz. */
export function bugTripOffer(s: GameState): boolean {
  return s.devices.some((d) => d.id === 'bug1' && d.where === 'S1' && d.minutes === 0) && hasPackage(s);
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

/** Skrót drugiego wyjazdu: nowy podsłuch z plecaka zastępuje martwy przy S1. */
export function tripAgain(s: GameState): StepResult {
  if (!bugTripOffer(s)) return step(s);
  if (s.money < TRIP_AGAIN.cost) {
    return step(s, [], [{ kind: 'toast', text: `Brakuje ${TRIP_AGAIN.cost - s.money} ¤ na dojazd.`, bad: true }]);
  }
  const carried = s.devices.find((d) => d.id === 'bug1' && d.where === 'plecak')!;
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
  return step(n, [{
    html: `<span class="c">${gclk(n)} · wróciłeś. Nowy PODSŁUCH-1 podpięty w szafce przy S1.</span>${def?.bugReplacedText ? ` <span class="d">${def.bugReplacedText}</span>` : ''}`,
  }]);
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
    && !s.devices.some((d) => d.where === 'S1');
}
