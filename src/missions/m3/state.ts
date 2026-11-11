/** Wpis dziennika kamer (minuty dnia): wyłączona od `off`, włączona o `on` (null: nadal wyłączona). */
export type CamLog = { ip: string; off: number; on: number | null; src: 'man' | 'at'; caught?: boolean };
export type M3Window = { start: number; len: number };
export type M3State = {
  win: M3Window; log: CamLog[]; err: number;
  leg: 1 | 2;                 // 1: winda → 712, 2: 712 → winda (plan 32)
  wins: M3Window[];           // udane okna
  late: boolean;              // zapłata 1500 zamiast 2000 ¤
  ok: boolean;                // droga powrotna oceniona (plan 32)
  evalAt: number | null;      // start okna, które już oceniono
  extra: boolean;             // zbędna kamera zgasła w oknie
  notice: number | null;      // minuta wiadomości L. w drodze powrotnej
  noticed: boolean;           // wiadomość przyszła (plan 32)
  fail: boolean;              // zlecenie odwołane (drugi błąd)
};

/** Ochrona sprawdza kamerę, która nie działa dłużej niż 7 min (makieta linia 1701). */
export const CAM_MAX = 7;
/** Druga próba: 21:44. */
export const M3_RETRY_START = 21 * 60 + 44;
/** Wiadomość L. o wyjściu: 28 min po końcu okna. */
export const M3_NOTICE_AFTER = 28;
/** Wyjście z 712: 5 min po wiadomości. */
export const M3_BACK_LEAD = 5;

/** Okno przejścia z windy do 712: 21:14, 3 min. */
export const M3_WINDOW: M3Window = { start: 21 * 60 + 14, len: 3 };

export function initM3State(): M3State {
  return {
    win: { ...M3_WINDOW }, log: [], err: 0, leg: 1, wins: [], late: false, ok: false,
    evalAt: null, extra: false, notice: null, noticed: false, fail: false,
  };
}

/** Kamera wyłączona w minucie `t` (camState z makiety, linia 1698). */
export function camIsOff(m: M3State, ip: string, t: number): boolean {
  return m.log.some((c) => c.ip === ip && c.off <= t && (c.on === null || c.on > t));
}

/** Wpisy kamer wyłączonych w minucie `t` (offNow, linia 1702). */
export function offAt(m: M3State, t: number): CamLog[] {
  return m.log.filter((c) => c.off <= t && (c.on === null || c.on > t));
}
