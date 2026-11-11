// @vitest-environment jsdom
import '../../src/missions';
import '../../src/apps/clock/register';
import { act } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { PlanWalkListener, WalkingFloorPlan } from '../../src/apps/plan/WalkingFloorPlan';
import { APPS } from '../../src/apps/registry';
import { slots } from '../../src/screens/desktop/slots';
import { m3Check } from '../../src/missions/m3/window';
import { atT, cams, home } from '../missions/m3/helpers';
import { renderWithStore } from './helpers';

afterEach(() => { vi.useRealTimers(); });

test('zdarzenie walk rysuje kropkę na planie, a potem ją chowa', () => {
  vi.useFakeTimers();
  const s = atT(home(cams()), 1275);
  const { store } = renderWithStore(<><PlanWalkListener /><WalkingFloorPlan /></>, s);
  act(() => store.apply(m3Check(s)));
  act(() => { vi.advanceTimersByTime(1200); });
  expect(document.querySelector('#plan7 circle.dot.seen')).not.toBeNull();
  act(() => { vi.advanceTimersByTime(3000); });
  expect(document.querySelector('#plan7 circle.dot')).toBeNull();
});
test('rejestracje: okno planu z kropką, słuchacz na pulpicie', () => {
  expect(APPS.plan.component).toBe(WalkingFloorPlan);
  expect(slots('desktop').map((x) => x.id)).toContain('plan-walk');
});
