import type { BakeItem } from '../../engine/wytrych';

export type BakeGood = Exclude<BakeItem, '+' | '×' | '−'>;

// misja.html linie 1576–1578 (kolory wypieków to rysunek, nie motyw)
export const BAKE_ICONS: Record<BakeGood, string> = {
  chleb: '<svg viewBox="0 0 48 48" aria-label="chleb"><path d="M5 31c0-10 8.5-16 19-16s19 6 19 16v3a3 3 0 01-3 3H8a3 3 0 01-3-3z" fill="#b8742f" stroke="#6e3f14" stroke-width="1.5"/><path d="M5 31c0-10 8.5-16 19-16s19 6 19 16" fill="none" stroke="#d99a52" stroke-width="2"/><path d="M14 22l4 6M22 19l4 7M30 20l4 6" stroke="#f2d18f" stroke-width="2.4" stroke-linecap="round"/></svg>',
  bulka: '<svg viewBox="0 0 48 48" aria-label="bułka"><ellipse cx="24" cy="28" rx="17" ry="12" fill="#d79a48" stroke="#7a4a1a" stroke-width="1.5"/><ellipse cx="24" cy="25" rx="13" ry="7" fill="#e8b468" opacity=".7"/><path d="M12 25c6 4 18 4 24 0" fill="none" stroke="#f7dca6" stroke-width="2.4" stroke-linecap="round"/><circle cx="18" cy="22" r=".9" fill="#fff4d6"/><circle cx="27" cy="21" r=".9" fill="#fff4d6"/><circle cx="31" cy="24" r=".9" fill="#fff4d6"/></svg>',
  rogal: '<svg viewBox="0 0 48 48" aria-label="rogal"><path d="M4 35C4 14 44 14 44 35c-3 0-6-2-9-6-6-7-16-7-22 0-3 4-6 6-9 6z" fill="#e0a24e" stroke="#7a4a1a" stroke-width="1.5" stroke-linejoin="round"/><path d="M13 20l3 7M24 17v8M35 20l-3 7" stroke="#8a5420" stroke-width="1.8" stroke-linecap="round"/><path d="M9 27c2-6 8-10 15-10" fill="none" stroke="#f2cf8f" stroke-width="1.6" stroke-linecap="round" opacity=".8"/></svg>',
};

export const BAKE_NAMES: Record<BakeGood, string> = { chleb: 'chleb', bulka: 'bułka', rogal: 'rogal' };
