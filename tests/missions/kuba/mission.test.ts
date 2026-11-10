import { expect, test } from 'vitest';
import { newGame } from '../../../src/engine/state';
import { acceptOffer, stageIndex, stageView } from '../../../src/engine/missions';
import { goMap, appBadge, notesView } from '../../../src/engine/desktop';
import { helpGroups } from '../../../src/engine/help';
import { buy } from '../../../src/engine/shop';
import { devJumps } from '../../../src/engine/dev';
import { drawBake } from '../../../src/missions/kuba/logic';
import { kubaAccepted, txt } from './helpers';
import '../../../src/missions';

test('przed odpowiedzią: etap 0, Mapa otwiera się, bez plakietki Darknetu', () => {
  const s = newGame(1);
  expect(stageIndex(s)).toBe(0);
  expect(stageView(s)[0].coach).toBe('Przeczytaj mail od Kuby w Poczcie i odpowiedz mu.');
  const m = goMap(s);
  expect(m.state.screen).toBe('mapPoland');
  expect(appBadge(s, 'darknet')).toBeNull();
});
test('przyjęcie: 20:33, wypieki z ziarna, linia, etap 1, plakietka Darknetu', () => {
  const s = kubaAccepted(9);
  expect(s.t).toBe(20 * 60 + 33);
  expect(s.active).toBe('kuba');
  expect(s.mission.kuba.bake).toEqual(drawBake(9));
  // linię dopisuje store z wyniku kroku (jak każde StepResult.lines)
  expect(txt(acceptOffer(newGame(9), 'kuba'))).toContain('<span class="d">Kuba odpisał. IP serwera Zenka masz w Notatkach.</span>');
  expect(s.mail.threads.kuba.at(-1)!.html).toContain('W Terminalu: <b>connect</b> i jego IP.');
  expect(stageIndex(s)).toBe(1);
  expect(appBadge(s, 'darknet')).toBe('!');
});
test('Wytrych z Darknetu: 0 ¤, plakietka znika, grupa Włamanie nowa, etap bez zmian', () => {
  const r = buy(kubaAccepted(), 'wyt');
  expect(r.state.money).toBe(0);
  expect(txt(r)).toContain('Zainstalowano: Wytrych 1.0');
  expect(appBadge(r.state, 'darknet')).toBeNull();
  const g = helpGroups(r.state).find(x => x.group.title === 'Włamanie')!;
  expect([g.unlocked, g.isNew]).toEqual([true, true]);
  expect(stageIndex(r.state)).toBe(1);
});
test('Ściąga Kuby zastępuje wspólną', () => {
  expect(helpGroups(newGame(1)).map(g => g.group.title)).toEqual(['Podstawowe', 'Połączenie', 'Włamanie', 'Na serwerze']);
});
test('Notatki: IP serwera Zenka z przyciskiem wstawiającym connect', () => {
  const c = notesView(kubaAccepted()).cards;
  expect(c).toHaveLength(1);
  expect(c[0].html).toContain('<b style="color:var(--acc)">83.21.40.17</b>');
  expect(c[0].insert).toBe('connect 83.21.40.17');
});
test('skok dev: misja 1', () => {
  const j = devJumps().find(x => x.id === 'kuba')!;
  expect(j.label).toBe('misja 1 (Kuba)');
  expect([j.make().day, j.make().t, j.make().active]).toEqual(['śr', 1230, null]);
});
