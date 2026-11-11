import { registerBuyHandler, buyHandler } from './buyHandlers';
import type { GameState, Line, StepResult, UiEvent } from './types';
import { step } from './types';
import { fmt } from './text';
import { focusMission, missionDef } from './missions';

export type ShopIcon = 'cpu' | 'ram' | 'net' | 'bug' | 'eye' | 'loop' | 'key';
export type ShopItem = {
  id: string; icon: ShopIcon; name: string; desc: string; price: number; multi?: boolean;
  apply?: (s: GameState) => GameState; lines?: string[];
};

const hw = (patch: Partial<GameState['hw']>) => (s: GameState): GameState => ({ ...s, hw: { ...s.hw, ...patch } });

export const HW_ITEMS: ShopItem[] = [
  { id: 'cpu1', icon: 'cpu', name: 'Celeron N4020', desc: '1,1 GHz, 2 rdzenie. To, co miałeś w szafie.', price: 0, apply: hw({ cpu: 1.1 }) },
  { id: 'cpu2', icon: 'cpu', name: 'Ryzen 5 Neon', desc: '3,6 GHz. Łamanie haseł około 3× szybsze.', price: 1100, apply: hw({ cpu: 3.6 }) },
  { id: 'cpu3', icon: 'cpu', name: 'Quantum QX-9', desc: '5,8 GHz. Dla zleceń od korporacji.', price: 6800, apply: hw({ cpu: 5.8 }) },
  { id: 'ram16', icon: 'ram', name: 'RAM 16 GB', desc: 'Trzy programy w tle zamiast jednego.', price: 700, apply: hw({ ram: 16 }) },
];

export const NET_ITEMS: ShopItem[] = [
  { id: 'net2', icon: 'net', name: 'ADSL 2 Mb/s', desc: 'Pobranie 100 MB trwa ponad 6 minut.', price: 0, apply: hw({ net: 2, netName: 'ADSL' }) },
  { id: 'net100', icon: 'net', name: 'Światłowód 100 Mb/s', desc: 'Pliki z serwerów w kilka sekund.', price: 450, apply: hw({ net: 100, netName: 'Światłowód' }) },
  { id: 'net1000', icon: 'net', name: 'Światłowód 1 Gb/s', desc: 'Uciekasz, zanim Cię namierzą.', price: 1800, apply: hw({ net: 1000, netName: 'Giga' }) },
];

export const DARK_ITEMS: ShopItem[] = [
  {
    id: 'wyt', icon: 'key', name: 'Wytrych 1.0', price: 100,
    desc: 'Łamie proste hasła. Uruchamiasz go w Terminalu poleceniem crack. Sprzedawca: kr0nos ★ 4,7',
    lines: ['<span class="c">Zainstalowano: Wytrych 1.0</span> <span class="d">(z Darknetu). Uruchamia go polecenie crack. Ikona na pulpicie.</span>'],
  },
  { id: 'pods', icon: 'net', name: 'PODSŁUCH-1', desc: 'Urządzenie do szafki operatora, zapas pracy 60 min. Dostawa do paczkomatu. Sprzedawca: kabelek ★ 4,6', price: 150, multi: true },
  { id: 'v1', icon: 'bug', name: 'Szarańcza v1.2', desc: 'Wymagana w misji 3. Sprzedawca: nullbyte ★ 4,8', price: 900 },
  { id: 'v2', icon: 'eye', name: 'Cichy Kot v0.9', desc: 'Namierzanie rośnie o 30% wolniej. Sprzedawca: m1au', price: 1400 },
  { id: 'v3', icon: 'loop', name: 'Pętla v2.0', desc: 'Na 20 s zatrzymuje namierzanie. Sprzedawca: kr0nos', price: 2200 },
];

export { registerBuyHandler };

export function toolsCount(s: GameState): number {
  return DARK_ITEMS.filter((i) => !i.multi && s.owned.includes(i.id)).length;
}

export function buy(s: GameState, id: string): StepResult {
  const it = [...HW_ITEMS, ...NET_ITEMS, ...DARK_ITEMS].find((i) => i.id === id);
  if (!it) return step(s);
  if (!it.multi && s.owned.includes(id)) return step(s);
  const h = buyHandler(id);
  const refused = h?.guard?.(s);
  if (refused) return step(s, [], [{ kind: 'toast', text: refused, bad: true }]);
  if (s.money < it.price) {
    return step(s, [], [{ kind: 'toast', text: `Brakuje ${fmt(it.price - s.money)} ¤ na ${it.name}`, bad: true }]);
  }
  let state: GameState = {
    ...s,
    money: s.money - it.price,
    owned: it.multi ? s.owned : [...s.owned, id],
    stats: { ...s.stats, buys: s.stats.buys + 1 },
  };
  if (it.apply) state = it.apply(state);
  const lines: Line[] = (it.lines ?? []).map((html) => ({ html }));
  const ui: UiEvent[] = [{ kind: 'toast', text: `Kupiono: ${it.name}` }];
  const chain = (r: StepResult) => { state = r.state; lines.push(...r.lines); ui.push(...r.ui); };
  if (h) chain(h.fn(state));
  const onBuy = missionDef(focusMission(state))?.onBuy;
  if (onBuy) chain(onBuy(state, id));
  return step(state, lines, ui);
}
