export type WState = {
  /** Cel (serwer plików 10.42.7.12) trafiony poleceniem probe. */
  found: boolean;
  /** Choć raz zszedł z serwera banku poleceniem disconnect. */
  disc: boolean;
  /** W chwili wysłania pliku nadal połączony z S1 (kara −10 min urządzenia). */
  leftS1: boolean;
  /** Plik wysłany prosto z serwera banku (bez premii „Rozłączony z serwerem”). */
  sentOnSrv: boolean;
};
export function initWState(): WState {
  return { found: false, disc: false, leftS1: false, sentOnSrv: false };
}
