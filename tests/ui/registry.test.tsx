// @vitest-environment jsdom
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it } from 'vitest';
import { APPS, registerApp, visibleIcons } from '../../src/apps/registry';
import { HelpApp } from '../../src/apps/help/HelpApp';
import { activeTerminalView, registerTerminalView } from '../../src/apps/terminal/views';
import { registerSlot, slots } from '../../src/screens/desktop/slots';
import { game, withMission } from '../engine/fixtures';
import { day2 } from '../helpers/states';
import { Probe, renderWithStore } from './helpers';

let restore = () => {};
afterEach(() => restore());

it('ikony nowej gry', () => {
  expect(visibleIcons(game())).toEqual(['terminal','mail','browser','darknet','map','netmap','help','notes','achievements']);
});
it('Wytrych, Pobrane i Plan piętra', () => {
  const s = game({ owned: [...game().owned, 'wyt'], downloads: [{ name: 'playlista.txt', size: '4 KB', mission: 'kuba', host: '83.21.40.17', fileId: 'p' }] });
  expect(visibleIcons(s)).toEqual(['terminal','mail','browser','darknet','map','netmap','wytrych','help','notes','achievements','downloads']);
  restore = withMission('m3', { apps: ['plan'] });
  expect(visibleIcons({ ...day2(), active: 'm3' })).toContain('plan');
});
it('rozmiary okien', () => {
  expect(APPS.terminal.rect(1920, 1080)).toEqual({ x: 220, y: 64, w: 680, h: 440 });
  expect(APPS.mail.rect(1920, 1080)).toEqual({ x: 800, y: 80, w: 760, h: 540 });
  expect(APPS.mail.rect(1024, 768).x).toBe(0);
  expect(APPS.netmap.rect(1920, 1080)).toEqual({ x: 200, y: 58, w: 1000, h: 970 });
});
it('registerApp podmienia wpis', () => {
  const C = () => null; registerApp('clock', { component: C, winTitle: () => 'X' });
  expect(APPS.clock.component).toBe(C); expect(APPS.clock.winTitle!(game())).toBe('X');
});
it('sloty i widoki Terminala', () => {
  const A = () => null; registerSlot('bar', 'probe', A); expect(slots('bar').map(x => x.id)).toContain('probe');
  registerTerminalView({ id: 'mc-test', active: s => s.t === 1, component: A });
  expect(activeTerminalView(game({ t: 1 }))?.id).toBe('mc-test'); expect(activeTerminalView(game({ t: 2 }))).toBeNull();
});
it('HelpApp: przycisk „Wpisz” otwiera Terminal', async () => {
  renderWithStore(<><HelpApp /><Probe /></>, day2());
  await userEvent.click(screen.getAllByRole('button', { name: /Wpisz/ })[0]);
  expect(screen.getByTestId('order')).toHaveTextContent('terminal');
});
