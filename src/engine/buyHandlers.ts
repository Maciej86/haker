// Rejestr akcji zakupu w osobnym module bez importów: devices.ts rejestruje 'pods' przy ładowaniu,
// a shop.ts → missions.ts → devices.ts to cykl (handlers w shop.ts byłby jeszcze niezainicjowany).
import type { GameState, StepResult } from './types';

export type BuyHandler = { fn: (s: GameState) => StepResult; guard?: (s: GameState) => string | null };
const handlers = new Map<string, BuyHandler>();

/** `guard` sprawdzany przed pobraniem pieniędzy: tekst idzie jako toast `bad`, zakup się nie odbywa. */
export function registerBuyHandler(
  id: string,
  fn: (s: GameState) => StepResult,
  guard?: (s: GameState) => string | null,
): void {
  handlers.set(id, { fn, guard });
}

export function buyHandler(id: string): BuyHandler | undefined {
  return handlers.get(id);
}
