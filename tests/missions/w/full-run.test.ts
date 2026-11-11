import { expect, test } from 'vitest';
import type { GameState } from '../../../src/engine/types';
import { realtimeTick } from '../../../src/engine/realtime';
import { endCrack } from '../../../src/engine/server';
import { skillSummaryRows } from '../../../src/engine/skills';
import { nextDay } from '../../../src/engine/clock';
import { visibleOffers } from '../../../src/engine/missions';
import { deserialize, serialize } from '../../../src/engine/state';
import { wAfterTripState } from '../../../src/missions/w/dev';
import { cleanLog, gotV2, home, run, sendV2 } from './helpers';

const play = (start: GameState) => {
  let s = run(start, 'use S1', 'scan', 'scan --type serwer', 'probe 10.42.7.12', 'crack 10.42.7.12').state;
  s = endCrack(s, 'ok').state;
  return sendV2(home(cleanLog(gotV2(s))));
};

test('przejście: umiejętności z powodami, pełna pula, Następny dzień', () => {
  const r = play(wAfterTripState());
  expect(r.state.summary).toEqual(expect.arrayContaining([
    { label: 'Umiejętności w tej misji', value: '', tone: 'dim' },
    { label: 'Sieć    ▮▮▮▯▯ +1', value: 'cel trafiony za pierwszym razem, włamanie bez namierzenia', tone: 'ok' },
    { label: 'Linux   ▮▮▯▯▯ +0,5', value: 'filtry polecenia scan, pobranie i czyste rozłączenie', tone: 'ok' }]));
  expect(r.state.summary!.slice(-skillSummaryRows(r.state).length)).toEqual(skillSummaryRows(r.state));
  expect(r.state.summaryMeta).toMatchObject({ money: 3400, xp: 80, next: 'nextDay' });
  const d = nextDay(r.state).state;
  expect(d).toMatchObject({ day: 'pt', t: 830, gains: [], overlay: null });
  expect(visibleOffers(d)).toContain('m3');
});

test('W. jako druga oferta: Koniec demo i motyw Halo Systems', () => {
  const r = play({ ...wAfterTripState(), done: ['kuba', 'm3'] });
  expect(r.state.summaryMeta!.next).toBe('end');
  expect(r.state.summary).toContainEqual({ label: 'Odblokowano: motyw Halo Systems (Start → Motyw)', value: '', tone: 'ok' });
});

test('overlay po porażce przetrwa odświeżenie', () => {
  const f = realtimeTick({ ...gotV2(), t: 1141 }, 1000).state; const b = deserialize(serialize(f))!;
  expect([b.failed, b.overlay, b.summaryMeta]).toEqual([true, 'summary', f.summaryMeta]);
});
