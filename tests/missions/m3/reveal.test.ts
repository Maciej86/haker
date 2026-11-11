import '../../../src/missions';
import { expect, test } from 'vitest';
import type { StepResult, UiEvent } from '../../../src/engine/types';
import { walkDuration } from '../../../src/engine/walk';
import { clockJump } from '../../../src/engine/missions';
import { m3Check } from '../../../src/missions/m3/window';
import { m3Jump } from '../../../src/missions/m3/clock';
import { atBothAt, atT, cams, home, withM3 } from './helpers';

type K<k extends UiEvent['kind']> = Extract<UiEvent, { kind: k }>;
const ev = <k extends UiEvent['kind']>(r: StepResult, kind: k) => r.ui.filter((e) => e.kind === kind) as K<k>[];
const lastMail = (r: StepResult) => r.state.mail.threads.m3!.at(-1)!;

test('za późno: wynik schowany do końca przejścia (2336 ms)', () => {
  const r = m3Check(atT(home(cams()), 1275));
  const [w] = ev(r, 'walk');
  expect(walkDuration(w)).toBe(2336);
  expect(ev(r, 'toast')).toEqual([]);
  expect(w.after).toEqual([{ kind: 'toast', text: 'L.: za późno. Nowe okno 21:44', bad: true }]);
  const [h] = ev(r, 'termHold');
  expect(h).toMatchObject({ ms: 2336, steps: 1 });
  expect(h.bar).toBeUndefined();
  expect(h.after.length).toBe(r.lines.length);
  h.after.forEach((l, i) => expect(l).toBe(r.lines[i])); // te same obiekty, które Store dopisze do Terminala
  expect(ev(r, 'mailArrives')).toEqual([{ kind: 'mailArrives', thread: 'm3', msg: lastMail(r), delayMs: 2336, toast: null, exact: true }]);
});
test('dobrze: przyrost umiejętności i toast po przejściu (5800 ms)', () => {
  const r = m3Check(atT(home(atBothAt(cams())), 1275));
  const [w] = ev(r, 'walk');
  expect(walkDuration(w)).toBe(5800);
  expect(ev(r, 'gain')).toEqual([]);
  expect(w.after).toEqual([
    { kind: 'gain', sk: 'Skrypty', v: 0.5, why: 'zadanie at dokładnie na okno' },
    { kind: 'toast', text: 'L.: jest w 712. Czekaj na wiadomość o wyjściu' },
  ]);
  expect(ev(r, 'termHold')[0].ms).toBe(5800);
  expect(ev(r, 'mailArrives')[0]).toMatchObject({ delayMs: 5800, msg: lastMail(r) });
});
test('Przewiń w etapie 2 bez minuty wiadomości: nic nie robi', () => {
  const ok = m3Check(atT(home(atBothAt(cams())), 1275)).state;
  const bad = withM3(ok, { notice: null });
  expect(m3Jump(bad).state).toBe(bad);
  const past = atT(ok, 1306);
  expect(clockJump(past).state).toBe(past);
});
