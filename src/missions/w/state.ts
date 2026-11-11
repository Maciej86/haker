export type WState = {
  /** Cel (serwer plików 10.42.7.12) trafiony poleceniem probe. */
  found: boolean;
  /** Choć raz zszedł z serwera banku poleceniem disconnect. */
  disc: boolean;
};
export function initWState(): WState {
  return { found: false, disc: false };
}
