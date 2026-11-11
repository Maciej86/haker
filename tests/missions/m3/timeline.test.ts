import { expect, test } from 'vitest';
import { CAM_MAX, M3_BACK_LEAD, M3_NOTICE_AFTER, M3_RETRY_START, camIsOff, initM3State } from '../../../src/missions/m3/state';
import { atCovers, atReady, camOffAt, camOnAt, dropJobsFrom, manualOff } from '../../../src/missions/m3/window';

const base = initM3State();
test('pełny stan startowy', () => {
  expect(base).toEqual({ win: { start: 1274, len: 3 }, log: [], err: 0, leg: 1, wins: [], late: false, ok: false,
    evalAt: null, extra: false, notice: null, noticed: false, fail: false });
  expect([CAM_MAX, M3_RETRY_START, M3_NOTICE_AFTER, M3_BACK_LEAD]).toEqual([7, 1304, 28, 5]);
});
test('cam off/on na osi czasu', () => {
  const a = camOffAt(base, '10.42.5.31', 1273, 'man')!;
  expect(a.log).toEqual([{ ip: '10.42.5.31', off: 1273, on: null, src: 'man' }]);
  expect(camOffAt(a, '10.42.5.31', 1274, 'man')).toBeNull();
  expect(base.log).toEqual([]);
  const b = camOnAt(a, '10.42.5.31', 1276)!;
  expect(camIsOff(b, '10.42.5.31', 1275)).toBe(true);
  expect(camIsOff(b, '10.42.5.31', 1276)).toBe(false);
  expect(camOnAt(b, '10.42.5.31', 1277)).toBeNull();
  expect(manualOff(a, 1274).map(c => c.ip)).toEqual(['10.42.5.31']);
  expect(manualOff(b, 1274)).toEqual([]);
});
test('zadania at: gotowe, pokrycie okna, przepadanie', () => {
  const job = (ip: string, off: number, min = 3) => ({ ip, off, on: off + min, src: 'at' as const });
  const m = { ...base, log: [job('10.42.5.31', 1274), job('10.42.5.33', 1274)] };
  expect([atReady(m), atCovers(m, m.win)]).toEqual([true, true]);
  const early = { ...base, log: [job('10.42.5.31', 1273, 5), job('10.42.5.33', 1274)] };
  expect([atReady(early), atCovers(early, early.win)]).toEqual([false, true]);
  expect(atCovers({ ...base, log: [job('10.42.5.31', 1274)] }, base.win)).toBe(false);
  expect(dropJobsFrom(m, 1274)).toEqual({ m: { ...m, log: [] }, dropped: 2 });
  expect(dropJobsFrom(m, 1275).dropped).toBe(0);
});
