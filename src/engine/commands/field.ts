import type { CommandTable } from '../terminal';
import type { GameState, Line, StepResult } from '../types';
import { andThen, step } from '../types';
import { advance } from '../clock';
import { esc } from '../text';
import { useDevice, bug } from '../devices';
import { isLinkedToS1 } from './basic';

const s1Minutes = (s: GameState): number => s.devices.find((d) => d.where === 'S1')?.minutes ?? 0;

/** Zejście z S1 na komputer; urządzenie zostaje w szafce, zapas nie maleje. */
export function leaveS1(s: GameState): StepResult {
  const n: GameState = { ...s, terminal: { ...s.terminal, location: { kind: 'home' } } };
  return step(n, [{
    html: `<span class="c">Rozłączono z PODSŁUCH-1.</span> <span class="d">Urządzenie zostaje w szafce przy S1, zapas ${s1Minutes(s)} min nie maleje.</span>`,
  }]);
}

const say = (s: GameState, html: string): StepResult => step(s, [{ html }]);

export const FIELD_COMMANDS: CommandTable = {
  use: ([arg], s) => {
    if (!arg) return say(s, 'Użycie: use &lt;skrzynka&gt;, np. use S1');
    if (arg.toUpperCase() !== 'S1') {
      return say(s, `<span class="r">Przy skrzynce ${esc(arg.toUpperCase())} nie masz urządzenia.</span>`);
    }
    if (isLinkedToS1(s)) return say(s, '<span class="d">Już połączono z PODSŁUCH-1.</span>');
    const dev = s.devices.find((d) => d.id === 'bug1' && d.where === 'S1');
    if (!dev) {
      return bug(s)
        ? say(s, '<span class="r">PODSŁUCH-1 jest w plecaku.</span>')
        : say(s, '<span class="r">PODSŁUCH-1 jest jeszcze w paczce na przystanku w Poznaniu.</span>');
    }
    if (dev.minutes === 0) return say(s, '<span class="r">PODSŁUCH-1 nie odpowiada: wyczerpany zapas pracy.</span>');

    const lines: Line[] = [];
    let cur = s;
    if (s.net.reusedBug && !s.net.reuseAnnounced) {
      lines.push({ html: `<span class="d">PODSŁUCH-1 z poprzedniej misji wciąż wisi w szafce przy S1.</span>` });
      cur = { ...cur, net: { ...cur.net, reuseAnnounced: true } };
    }
    const left = Math.max(0, dev.minutes - 1);
    lines.push(
      { html: '<span class="d">Łączenie z PODSŁUCH-1 przez skrzynkę S1…</span>' },
      { html: '<span class="d">… uzgadnianie kanału</span>' },
      { html: `<span class="c">PODSŁUCH-1 online. Sygnał z sieci za skrzynką S1.</span>\n<span class="d">Zapas pracy: ${left} min · połączenie kosztowało 2 min gry i 1 min urządzenia.</span>` },
    );
    cur = advance({ ...cur, terminal: { ...cur.terminal, location: { kind: 'S1' } } }, 2);
    const r = step(cur, lines, [{ kind: 'toast', text: 'PODSŁUCH-1 online · krok „Połączenie z podsłuchem” zaliczony' }]);
    return andThen(r, (x) => useDevice(x, 1));
  },
};
