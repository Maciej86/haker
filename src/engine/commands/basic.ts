import type { CommandTable } from '../terminal';
import type { GameState } from '../types';
import { step } from '../types';
import { packageWaiting } from '../devices';
import { focusMission, missionDef } from '../missions';
import { endCrack } from '../server';

const HELP_TEXT = `<span class="c">Dostępne polecenia</span>
  devices           twoje urządzenia w terenie
  use &lt;skrzynka&gt;    połącz z urządzeniem przy skrzynce, np. use S1
  status            stan połączenia
  scan              skanuj sieć za skrzynką (otwiera NetMap)
    --net 10.42.7     tylko podsieć        (filtry: za darmo,
    --type serwer     tylko dany kształt    działają na wyniku
    --off 18-24       wyłączone w tych godz. ostatniego skanu)
  probe &lt;ip&gt;        sprawdź, czym jest urządzenie (6 min gry, 3 min urządz.)
  crack &lt;ip&gt;        włamanie (Wytrych), abort przerywa
  mc                menedżer plików serwera (F3 podgląd, F4 edycja, F5 pobierz)
  cd, ls, info, cat pliki na serwerze bez mc; każde polecenie podnosi namierzanie
  get &lt;plik&gt;        pobieranie do Pobranych
  edit, rm          edycja i usuwanie pliku na serwerze
  disconnect        zejście o jeden poziom: serwer → S1 → komputer
  route bank        trasa twojego ruchu do banku (z konta klienta)
  notes             otwórz notatki z rozpoznania
  whoami, clear
<span class="d">Pełny spis z opisami: Ściąga na pulpicie.</span>`;

const NOT_YET = '<span class="d">Nie masz jeszcze urządzeń w terenie.</span>';
const DEVICES_HEAD = '<span class="d">Urządzenie   Miejsce                       Stan              Zapas</span>';

export function isLinkedToS1(s: GameState): boolean {
  const l = s.terminal.location;
  return l.kind === 'S1' || (l.kind === 'host' && l.via === 'S1');
}

export const BASIC_COMMANDS: CommandTable = {
  help: (_a, s) => step(s, [{ html: HELP_TEXT }]),
  whoami: (_a, s) => step(s, [{ html: 'ghost' }]),
  clear: (_a, s) => step({ ...s, terminal: { ...s.terminal, lines: [] } }),
  notes: (_a, s) =>
    step(s, [{ html: '<span class="d">Otwarto Notatki.</span>' }], [{ kind: 'open', app: 'notes' }]),
  status: (_a, s) => {
    if (!isLinkedToS1(s)) return step(s, [{ html: '<span class="d">Brak połączenia.</span>' }]);
    const min = s.devices.find((d) => d.where === 'S1')?.minutes ?? 0;
    return step(s, [{
      html: `<span class="c">PODSŁUCH-1 online</span> · łącze S1 (Net-Operator) · zapas pracy ${min} min · <span class="d">widoczny w sieci banku jako 10.42.0.250</span>`,
    }]);
  },
  devices: (_a, s) => {
    const waiting = packageWaiting(s);
    if (s.devices.length === 0 && !waiting) return step(s, [{ html: NOT_YET }]);
    const rows: string[] = [DEVICES_HEAD];
    for (const d of s.devices.filter((x) => x.where === 'S1')) {
      const st = d.minutes === 0
        ? '<span class="r">wyczerpany</span>       '
        : isLinkedToS1(s)
          ? '<span class="c">online</span>           '
          : '<span class="y">czeka</span>            ';
      rows.push(`PODSŁUCH-1   skrzynka S1 · Poznań-Centrum  ${st}${d.minutes} min   <span class="d">adres w sieci banku: 10.42.0.250</span>`);
    }
    for (const d of s.devices.filter((x) => x.where === 'plecak')) {
      rows.push(`PODSŁUCH-1   <span class="y">w plecaku (nowy)</span>                       ${d.minutes} min   <span class="d">niepodpięty</span>`);
    }
    if (waiting) {
      const giver = missionDef(focusMission(s))?.giver.name ?? '';
      rows.push(`PODSŁUCH-1   <span class="y">paczka od ${giver}</span>   zapas 60 min   <span class="d">(czeka na przystanku obok wieżowca)</span>`);
    }
    return step(s, [{ html: rows.join('\n') }]);
  },
  abort: (_a, s) => {
    if (s.srv.crack) return endCrack(s, 'abort');
    if (s.srv.dl) {
      return step({ ...s, srv: { ...s.srv, dl: null } }, [{ html: '<span class="r">Pobieranie przerwane.</span>' }],
        [{ kind: 'stopTimer', timer: 'download' }]);
    }
    return step(s, [{ html: '<span class="d">Nic nie trwa.</span>' }]);
  },
};
