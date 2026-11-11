// @vitest-environment jsdom
import { screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { FloorPlanApp } from '../../src/apps/plan/FloorPlan';
import { visibleIcons } from '../../src/apps/registry';
import { acceptOffer } from '../../src/engine/missions';
import { m3StartState } from '../../src/missions/m3/dev';
import { renderWithStore } from './helpers';

const acc = () => acceptOffer(m3StartState(), 'm3').state;

test('okno pokazuje plan i wiersze', () => {
  renderWithStore(<FloorPlanApp />, acc());
  expect(document.querySelector('#plan7 .room.goal')).not.toBeNull();
  expect(document.querySelectorAll('#plan7 circle.cam')).toHaveLength(4);
  expect(screen.getByText('21:14–21:17 · 3 min')).toBeInTheDocument();
  expect(screen.getByText(/Trasa: winda → korytarz B → 712/)).toBeInTheDocument();
});
test('ikona tylko przy przyjętej misji L.', () => {
  expect(visibleIcons(m3StartState())).not.toContain('plan');
  expect(visibleIcons({ ...m3StartState(), done: ['kuba', 'w'] })).not.toContain('plan'); // L. w centrum uwagi, ale nieprzyjęta
  expect(visibleIcons(acc())).toContain('plan');
});
test('bez zlecenia: komunikat', () => {
  renderWithStore(<FloorPlanApp />, m3StartState());
  expect(screen.getByText('Plan piętra pojawi się w zleceniu.')).toBeInTheDocument();
});
