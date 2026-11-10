// @vitest-environment jsdom
import { act, cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { Desktop } from '../../src/screens/desktop/Desktop';
import { TopBar } from '../../src/screens/desktop/TopBar';
import { barLabel } from '../../src/engine/desktop';
import { deadlineLabel } from '../../src/engine/clock';
import { stageView } from '../../src/engine/missions';
import { setPref } from '../../src/ui/prefs';
import { game } from '../engine/fixtures';
import { day2 } from '../helpers/states';
import { renderWithStore } from './helpers';

beforeEach(() => { renderWithStore(<Desktop />); });

it('korzeń ekranu', () => {
  expect(document.querySelector('[data-screen="desktop"]')).not.toBeNull();
});
it('górny pasek: zlecenie i zegar, bez terminu u Kuby', () => {
  expect(screen.getByText('NeonOS')).toBeInTheDocument();
  expect(within(screen.getByRole('banner')).getByText(barLabel(game()))).toBeInTheDocument();
  expect(screen.getByText('śr 20:30')).toBeInTheDocument(); expect(screen.queryByText('termin')).toBeNull();
});
it('termin z deadlineLabel', () => {
  cleanup(); const s = { ...day2(), active: 'w' as const, t: 18 * 60 + 45 };
  renderWithStore(<TopBar />, s);
  const dl = deadlineLabel(s)!; expect(screen.getByText('termin')).toBeInTheDocument();
  expect(screen.getByText(dl.text.split(' · ')[0])).toBeInTheDocument();
  const rest = screen.getByText(`· ${dl.text.split(' · ').slice(1).join(' · ')}`);
  expect(rest.style.color).toBe(dl.red ? 'var(--red)' : 'var(--dim)');
});
it('ikony w kolejności, plakietka Poczty', () => {
  const nav = screen.getByRole('navigation', { name: 'Pulpit' });
  expect(within(nav).getAllByRole('button').map(b => b.textContent!.replace(/[\d!]/g, ''))).toEqual(['Terminal','Poczta','Przeglądarka','Darknet','Mapa','NetMap','Ściąga','Notatki','Osiągnięcia']);
  expect(within(nav).getByRole('button', { name: /Poczta/ }).querySelector('.badge')).toHaveTextContent('1');
});
it('ikona otwiera okno i przycisk na pasku zadań', async () => {
  await userEvent.click(within(screen.getByRole('navigation', { name: 'Pulpit' })).getByRole('button', { name: /Przeglądarka/ }));
  expect(screen.getByRole('region', { name: 'Przeglądarka' })).toBeInTheDocument();
  expect(within(screen.getByRole('contentinfo')).getByRole('button', { name: 'Przeglądarka' })).toHaveClass('active');
});
it('przycisk na pasku zadań przenosi okno na wierzch', async () => {
  const nav = within(screen.getByRole('navigation', { name: 'Pulpit' }));
  await userEvent.click(nav.getByRole('button', { name: /Przeglądarka/ }));
  await userEvent.click(nav.getByRole('button', { name: /Notatki/ }));
  const bar = within(screen.getByRole('contentinfo'));
  expect(bar.getByRole('button', { name: 'Przeglądarka' })).not.toHaveClass('active');
  await userEvent.click(bar.getByRole('button', { name: 'Przeglądarka' }));
  expect(bar.getByRole('button', { name: 'Przeglądarka' })).toHaveClass('active');
  expect(screen.getByRole('region', { name: 'Przeglądarka' })).toHaveClass('active');
});
it('Mapa u Kuby: tylko komunikat', async () => {
  await userEvent.click(screen.getByRole('button', { name: /Mapa/ }));
  expect(screen.getByText('Do Zenka nie musisz jechać: znasz IP jego serwera.')).toBeInTheDocument();
});
it('panel gracza bez stałych z makiety', () => {
  const hud = within(screen.getByRole('complementary', { name: 'Twój profil' }));
  for (const t of ['ghost', 'poziom 1', '40 / 200 XP', '1,6', '1,5', 'Kredyty', '100', 'Narzędzia', '1,1 GHz', '4 GB', '2 Mb/s']) expect(hud.getAllByText(t).length).toBeGreaterThan(0);
  expect(screen.queryByText('1 250')).toBeNull();
  expect(within(screen.getByRole('contentinfo')).getByText('ADSL 2 Mb/s')).toBeInTheDocument();
});
it('Postęp zlecenia: bieżący etap z „co teraz”, wyłączenie podpowiedzi', () => {
  const st = stageView(game()).find(x => x.state === 'now')!;
  expect(screen.getByText(st.title).closest('.stage')).toHaveClass('now');
  expect(screen.getByText(/^co teraz:/)).toBeInTheDocument();
  act(() => setPref('neonos-coach', 'off')); expect(screen.queryByText(/^co teraz:/)).toBeNull();
});
