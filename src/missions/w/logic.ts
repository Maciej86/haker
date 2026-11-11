import type { GameState, Line, StepResult } from '../../engine/types';
import { step } from '../../engine/types';
import { fill } from '../../engine/text';
import { bug, bugAtS1, bugTripOffer, reusedBugSub } from '../../engine/devices';
import { isLinkedToS1 } from '../../engine/commands/basic';
import { TRIP_FAILED_SUB, hasPackage, tripFailed } from '../../engine/trip';
import { gain } from '../../engine/skills';
import { RECON_COMMANDS } from '../../engine/commands/recon';
import { onServer } from '../../engine/server';
import type { CommandTable } from '../../engine/terminal';
import type { NetSide, NetworkOverlay } from '../../engine/missions';
import { buyHint, hintView } from '../../engine/missions';
import type { TowerNode } from '../../world/tower';
import {
  W_ACCEPTED_LINE, W_ALREADY_FOUND, W_DIRECT_LINE, W_HIT_LINES, W_HIT_TOAST, W_MISS_LINE, W_TARGET_IP,
} from './texts';
import { wBankLog } from './server';

/** Linie Terminala po przyjęciu zlecenia (makieta 1867–1868). */
export function wOnAccept(s: GameState): StepResult {
  const lines: Line[] = [{ html: W_ACCEPTED_LINE }];
  if (s.net.reusedBug) lines.push({ html: fill(W_DIRECT_LINE, { zapas: String(bug(s)!.minutes) }) });
  const n: GameState = { ...s, srv: { ...s.srv, log: wBankLog(s.day), logSeq: 5, logClean: false } };
  return step(n, lines);
}

/** Etap zlecenia (makieta linia 732, z poprawką na stan trwały: po skanie etap nie cofa się). */
export function wStageIndex(s: GameState): number {
  if (s.done.includes('w')) return 7;
  if (s.srv.cracked) return 6;
  if (s.mission.w.found) return 5;
  if (isLinkedToS1(s) || s.net.scanned) return 4;
  if (bugAtS1(s)) return 3;
  if (s.screen === 'trip') return 2;
  return s.active === 'w' ? 1 : 0;
}

/** Podpis etapu wyjazdu: pominięty (podsłuch już wisiał) albo nieudany. */
export function wStageSub(s: GameState, i: number): string | null {
  return i === 2 ? (reusedBugSub(s) ?? (tripFailed(s) ? TRIP_FAILED_SUB : null)) : null;
}

/** Pasek misji, gdy podsłuch padł w etapach 3–6, a pliku W. jeszcze nie ma (makieta 1409, 1419, 1422). */
export function wBugStep(s: GameState): string | null {
  const i = wStageIndex(s);
  if (i < 3 || i > 6 || s.downloads.some((f) => f.mission === 'w')) return null;
  if (s.devices.some((d) => d.id === 'bug1' && d.where === 'S1' && d.minutes === 0) && !hasPackage(s)) {
    return 'kup nowy PODSŁUCH-1 w Darknecie';
  }
  if (bugTripOffer(s)) return 'podepnij nowy PODSŁUCH-1 przy S1';
  if (i >= 5 && bugAtS1(s) && !isLinkedToS1(s)) return 'połącz się z PODSŁUCH-1 (use S1)';
  return null;
}

/** Pasek misji w Terminalu (makieta 1866, 1806, 870, 916, 1438, 1874, 1183, 1191, 959, 962). */
export function wTermStep(s: GameState): string {
  const dead = wBugStep(s);
  if (dead) return dead;
  switch (wStageIndex(s)) {
    case 0: return 'przeczytaj mail od W.';
    case 1:
    case 2: return 'otwórz Mapę i znajdź bank w Poznaniu';
    case 3: return 'połącz się z PODSŁUCH-1 (use S1)';
    case 4: return s.net.scanned ? 'znajdź cel: scan, NetMap, probe' : 'następny krok: znajdź cel w sieci za S1';
    case 5: return s.srv.crack ? 'włamanie: Wytrych' : 'następny krok: włamanie do 10.42.7.12';
    case 6:
      if (s.downloads.some((f) => f.mission === 'w')) {
        return isLinkedToS1(s) ? 'zejdź z S1 (disconnect) i odeślij plik' : 'odeślij plik w Poczcie';
      }
      return onServer(s) ? 'znajdź zestawienie przyjęte przez zarząd' : 'pobierz zestawienie';
    default: return 'zlecenie zakończone';
  }
}

/** Reakcja na probe (koszt i net.checked nalicza wspólne probe): pudło albo trafienie celu (makieta 1437–1439). */
export function wOnProbe(s: GameState, node: TowerNode): StepResult {
  const vars = { ip: node.ip, kto: node.kto };
  if (node.ip !== W_TARGET_IP) {
    return step(s, [{ html: fill(W_MISS_LINE, vars) }], [
      { kind: 'toast', text: `Pudło: ${node.kto}. −6 min gry, −3 min urządzenia`, bad: true },
    ]);
  }
  const first = s.net.checked.length === 1;
  const found: GameState = { ...s, mission: { ...s.mission, w: { ...s.mission.w, found: true } } };
  const g = gain(found, 'Sieć', first ? 0.5 : 0.3, first ? 'cel trafiony za pierwszym razem' : 'znalezienie celu');
  return step(g.state, W_HIT_LINES.map((l) => ({ html: fill(l, vars) })), [...g.ui, { kind: 'toast', text: W_HIT_TOAST }]);
}

/** Odmowa przed kosztem: po znalezieniu celu probe nic nie sprawdza. */
export const W_COMMANDS: CommandTable = {
  probe: (args, s) => (s.mission.w.found ? step(s, [{ html: W_ALREADY_FOUND }]) : RECON_COMMANDS.probe(args, s)),
};

/** Karta „Cel znaleziony” (makieta 1043). */
const W_FOUND_CARD: NetSide = {
  html: '<b style="color:var(--acc)">Cel znaleziony</b><br><span style="font-size:12px">10.42.7.12 · serwer plików centrali.<br>Serwer plików jest chroniony hasłem.</span>',
  buttons: [{ label: 'Włam się w Terminalu ›', hint: 'wpisze <code>crack 10.42.7.12</code>', cmd: 'crack 10.42.7.12' }],
};

/** Panel NetMap: karta celu po trafieniu i płatne podpowiedzi. */
export function wNetSide(s: GameState): { top?: NetSide; hints?: NetSide } {
  return { top: s.mission.w.found ? W_FOUND_CARD : undefined, hints: hintsSide(s) };
}

/** Kupione podpowiedzi i przycisk kolejnej (makieta 1037–1039). */
function hintsSide(s: GameState): NetSide | undefined {
  const v = hintView(s);
  if (!v) return undefined;
  return {
    html: v.shown.map((t) => `<div class="hint">${t}</div>`).join(''),
    buttons: v.next ? [{ label: `Podpowiedź ${v.next.n}/3 · ${v.next.price} ¤`, act: buyHint }] : [],
  };
}

export const W_NETWORK: NetworkOverlay = {
  isTarget: (_s, n) => n.ip === W_TARGET_IP,
  targetFound: (s) => s.mission.w.found,
  side: wNetSide,
};
