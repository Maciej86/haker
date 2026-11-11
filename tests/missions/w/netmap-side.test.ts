import { expect, test } from 'vitest';
import { acceptOffer, missionDef } from '../../../src/engine/missions';
import { W_HINTS } from '../../../src/missions/w/texts';
import { wStartState } from '../../../src/missions/w/dev';

const acc = () => acceptOffer(wStartState(), 'w').state;

test('podpowiedzi w panelu NetMap', () => {
  const h = missionDef('w').network!.side!(acc()).hints!;
  expect(h.html).toBe('');
  expect(h.buttons!.map(b => b.label)).toEqual(['Podpowiedź 1/3 · 15 ¤']);
  const after = h.buttons![0].act!(acc()).state;
  expect(after.money).toBe(acc().money - 15);
  const h2 = missionDef('w').network!.side!(after).hints!;
  expect(h2.html).toBe(`<div class="hint">${W_HINTS[0].text}</div>`);
  expect(h2.buttons!.map(b => b.label)).toEqual(['Podpowiedź 2/3 · 30 ¤']);
});
test('po znalezieniu: karta celu, bez przycisku podpowiedzi', () => {
  const a = acc(); const f = { ...a, hintsUsed: 1, mission: { ...a.mission, w: { ...a.mission.w, found: true } } };
  const side = missionDef('w').network!.side!(f);
  expect(side.top!.html).toContain('Cel znaleziony');
  expect(side.hints!.html).toBe(`<div class="hint">${W_HINTS[0].text}</div>`);
  expect(side.hints!.buttons ?? []).toEqual([]);
});
