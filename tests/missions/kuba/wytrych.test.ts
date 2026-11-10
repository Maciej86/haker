import { expect, test } from 'vitest';
import { wytrychView, wytrychAct } from '../../../src/engine/wytrych';
import { runLine } from '../../../src/engine/terminal';
import { stageIndex } from '../../../src/engine/missions';
import { bakeAnswer, drawBake } from '../../../src/missions/kuba/logic';
import { newGame, serialize, deserialize } from '../../../src/engine/state';
import type { GameState } from '../../../src/engine/types';
import { kubaAccepted, txt, withKuba } from './helpers';

const opened = () => { const s = kubaAccepted(3); return runLine({ ...s, owned: [...s.owned, 'wyt'] }, 'crack 83.21.40.17').state; };
const ans = (s: GameState) => String(bakeAnswer(s.mission.kuba.bake!));

test('bez crack: Brak celu', () => {
  expect(wytrychView({ ...kubaAccepted(), owned: ['cpu1', 'net2', 'wyt'] })).toEqual({ title: 'Wytrych 1.0 · 83.21.40.17 (serwer Zenka)', mode: 'none' });
});
test('bez misji w fokusie: sam tytuł', () => {
  const s: GameState = { ...newGame(1), done: ['kuba', 'w', 'm3'] };
  expect(wytrychView(s)).toEqual({ title: 'Wytrych 1.0', mode: 'none' });
  expect(wytrychAct(s, { kind: 'hint' }).state).toBe(s);
});
test('po crack: wypieki, 4 równania, 3 podpowiedzi do wzięcia', () => {
  const v = wytrychView(opened());
  expect(v.mode).toBe('bake');
  if (v.mode === 'bake') expect([v.bake.rows.length, v.bake.answer, v.bake.hintsLeft]).toEqual([4, null, 3]);
});
test('dobre hasło za pierwszym razem: +0,4 Sieć, 2 min, serwer, etap 4', () => {
  const s = opened(); const r = wytrychAct(s, { kind: 'answer', value: ` ${ans(s)} ` });
  expect(r.state.t).toBe(s.t + 2);
  expect(r.state.skills['Sieć']).toBeCloseTo(2.0);
  expect(r.state.gains).toContainEqual({ sk: 'Sieć', v: 0.4, why: 'hasło złamane za pierwszym razem' });
  expect(r.state.terminal.location).toMatchObject({ kind: 'host', ip: '83.21.40.17' });
  expect(r.state.stats.first).toBe(true);
  expect(r.state.mission.kuba).toMatchObject({ cracked: true, open: false, wrong: null, tries: 1 });
  expect(stageIndex(r.state)).toBe(4);
  expect(txt(r)).toContain(`Hasło złamane: ${ans(s)}. Zalogowano na 83.21.40.17 jako zenek.`);
  expect(r.ui).toContainEqual({ kind: 'toast', text: 'Dostęp uzyskany · krok „Włamanie” zaliczony' });
  const v = wytrychView(r.state);
  if (v.mode === 'bake') expect([v.bake.won, v.bake.answer]).toEqual([true, Number(ans(s))]);
  expect(wytrychAct(r.state, { kind: 'answer', value: '1' }).state).toBe(r.state);
});
test('zła odpowiedź nic nie kosztuje, potem +0,3', () => {
  const s = opened(); const bad = wytrychAct(s, { kind: 'answer', value: '<i>abc' });
  expect(bad.state.t).toBe(s.t);
  expect(bad.state.mission.kuba).toMatchObject({ tries: 1, cracked: false, wrong: '&lt;i&gt;abc' });
  expect(txt(bad)).toBe('<span class="r">Wytrych: hasło &lt;i&gt;abc odrzucone.</span>');
  expect(wytrychAct(bad.state, { kind: 'answer', value: ans(s) }).state.gains).toContainEqual({ sk: 'Sieć', v: 0.3, why: 'pierwsze włamanie Wytrychem' });
});
test('podpowiedzi: za darmo, najwyżej 3, potem +0,3', () => {
  const s = opened(); let h = s;
  for (let i = 0; i < 5; i++) h = wytrychAct(h, { kind: 'hint' }).state;
  expect([h.mission.kuba.hints, h.t, h.money]).toEqual([3, s.t, s.money]);
  const v = wytrychView(h); if (v.mode === 'bake') expect(v.bake.hints).toHaveLength(3);
  expect(wytrychAct(h, { kind: 'answer', value: ans(s) }).state.gains).toContainEqual({ sk: 'Sieć', v: 0.3, why: 'pierwsze włamanie Wytrychem' });
});
test('puste pole nie liczy próby', () => {
  expect(wytrychAct(opened(), { kind: 'answer', value: '  ' }).state.mission.kuba.tries).toBe(0);
});
test('ta sama zagadka po zapisie i odczycie', () => {
  const s = wytrychAct(opened(), { kind: 'hint' }).state;
  expect(wytrychView(deserialize(serialize(s))!)).toEqual(wytrychView(s));
});
test('stary zapis bez wypieków: zagadka z ziarna, bez awarii', () => {
  const s = withKuba(opened(), { bake: undefined as never });
  const v = wytrychView(s);
  expect(v.mode).toBe('bake');
  const good = String(bakeAnswer(drawBake(s.seed)));
  expect(wytrychAct(s, { kind: 'answer', value: good }).state.mission.kuba.cracked).toBe(true);
});
