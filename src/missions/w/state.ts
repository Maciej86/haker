export type WState = {
  /** Cel (serwer plików 10.42.7.12) trafiony poleceniem probe. */
  found: boolean;
};
export function initWState(): WState {
  return { found: false };
}
