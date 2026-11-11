import type { CommandTable } from '../terminal';
import type { GameState } from '../types';
import { step } from '../types';
import { advance } from '../clock';
import { esc } from '../text';
import { focusMission, missionDef, missionHost } from '../missions';
import { isLinkedToS1 } from './basic';

const directHost = (s: GameState, ip: string) => {
  const h = missionHost(s, ip);
  return h && h.access === 'direct' ? h : undefined;
};

export const DIRECT_COMMANDS: CommandTable = {
  connect: ([ip], s) => {
    if (!ip) {
      const hint = missionDef(focusMission(s))?.hosts?.[0]?.usageHint ?? '';
      return step(s, [{ html: `Użycie: connect &lt;ip&gt;.${hint}` }]);
    }
    const host = directHost(s, ip);
    if (!host) {
      return step(s, [{ html: `<span class="r">connect: brak odpowiedzi od ${esc(ip)}.</span> <span class="d">Sprawdź adres w Notatkach.</span>` }]);
    }
    const loc = s.terminal.location;
    if (loc.kind === 'host' && loc.ip === ip) return step(s, [{ html: '<span class="d">Już połączono.</span>' }]);
    const t = advance(s, 1);
    if (host.cracked(t)) {
      const next: GameState = {
        ...t,
        stats: { ...t.stats, first: true },
        terminal: { ...t.terminal, location: { kind: 'host', ip, path: '~', via: 'direct' } },
      };
      return step(next, [{ html: `<span class="c">Połączono z ${ip}.</span> <span class="d">Hasło już znasz.</span>` }]);
    }
    return host.onConnectLocked(t);
  },
  crack: ([ip], s) => {
    if (!s.owned.includes('wyt')) {
      return step(s, [{ html: 'crack: nie znaleziono polecenia. <span class="d">Nie masz jeszcze Wytrycha. Kupisz go w Darknecie.</span>' }]);
    }
    if (!ip) return step(s, [{ html: 'Użycie: crack &lt;ip&gt;' }]);
    const viaS1 = missionHost(s, ip);
    if (viaS1?.access === 'S1') return viaS1.onCrack(s);   // host za S1 (plan 21): misja woła startCrack
    const host = directHost(s, ip);
    if (!host) {
      // za S1 makieta zna jeden cel: „Użycie: crack 10.42.7.12” (linia 927), ale dopiero gdy cel jest znaleziony
      const def = missionDef(focusMission(s));
      const s1Host = def?.hosts?.find((h) => h.access === 'S1' && h.enterCmd);
      if (s1Host && isLinkedToS1(s) && def?.network?.targetFound?.(s)) return step(s, [{ html: `<span class="r">Użycie: ${s1Host.enterCmd}</span>` }]);
      return step(s, [{ html: `<span class="r">crack: brak odpowiedzi od ${esc(ip)}.</span>` }]);
    }
    if (host.cracked(s)) {
      return step(s, [{ html: `<span class="d">Hasło już złamane.</span>` }]);
    }
    return host.onCrack(s);
  },
};
