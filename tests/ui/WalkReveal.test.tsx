// @vitest-environment jsdom
import '../../src/missions';
import '../../src/apps/clock/register';
import { act, cleanup, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { PlanWalkListener, WalkingFloorPlan } from '../../src/apps/plan/WalkingFloorPlan';
import { walk } from '../../src/apps/plan/walk';
import { Terminal } from '../../src/apps/terminal/Terminal';
import { clearTermHold } from '../../src/apps/terminal/hold';
import { clearHiddenMail, useHiddenMail } from '../../src/apps/mail/delayed';
import { ToastHost } from '../../src/ui/Toast';
import { useRestart } from '../../src/ui/restart';
import { useGame } from '../../src/ui/useGame';
import { deserialize, serialize } from '../../src/engine/state';
import { m3Check } from '../../src/missions/m3/window';
import { atT, cams, home } from '../missions/m3/helpers';
import { Probe, renderWithStore } from './helpers';

afterEach(() => { cleanup(); walk.clear(); clearTermHold(); clearHiddenMail(); vi.useRealTimers(); });

const RESULT = 'Nowe okno: 21:44, 3 min.';
const TOAST = 'L.: za późno. Nowe okno 21:44';
let mailHidden = false;
let restart = () => {};
function Sonda() {
  const h = useHiddenMail(); restart = useRestart();
  const last = useGame((x) => x.mail.threads.m3?.at(-1)?.html ?? '');
  mailHidden = h('m3', last);
  return null;
}

function setup() {
  vi.useFakeTimers();
  const s = atT(home(cams()), 1275);
  const r = renderWithStore(<><Probe /><ToastHost /><Sonda /><PlanWalkListener /><WalkingFloorPlan /><Terminal /></>, s);
  act(() => r.store.apply(m3Check(s)));
  return r;
}

test('wynik okna dopiero po przejściu kropki: linia, toast, mail raz', () => {
  const { store } = setup();
  act(() => { vi.advanceTimersByTime(2300); });
  expect(document.querySelector('#plan7 circle.dot.seen')).not.toBeNull();
  expect(screen.queryByText(RESULT)).toBeNull();
  expect(screen.queryByText(TOAST)).toBeNull();
  expect(mailHidden).toBe(true);
  act(() => { vi.advanceTimersByTime(40); });
  expect(screen.getAllByText(RESULT)).toHaveLength(1);
  expect(screen.getAllByText(TOAST)).toHaveLength(1);
  expect(mailHidden).toBe(false);
  expect(document.querySelector('#plan7 circle.dot')).toBeNull();
  act(() => { vi.advanceTimersByTime(10_000); });
  expect(store.lines().filter((l) => l.html.includes(RESULT))).toHaveLength(1);
});
test('odświeżenie w trakcie przejścia: wynik widać od razu', () => {
  const { store } = setup();
  act(() => { vi.advanceTimersByTime(500); });
  const reloaded = deserialize(serialize(store.get()))!;
  cleanup();
  walk.clear(); clearTermHold(); clearHiddenMail(); // nowa strona: pamięć modułów pusta
  renderWithStore(<Terminal />, reloaded);
  expect(screen.getAllByText(RESULT)).toHaveLength(1);
});
test('nowa gra w trakcie przejścia: kropka znika, toast nie przychodzi', () => {
  setup();
  act(() => { vi.advanceTimersByTime(500); });
  expect(walk.get()).not.toBeNull();
  act(() => restart());
  expect(walk.get()).toBeNull();
  act(() => { vi.advanceTimersByTime(10_000); });
  expect(screen.queryByText(TOAST)).toBeNull();
});
