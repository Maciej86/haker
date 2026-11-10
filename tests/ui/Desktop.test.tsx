// @vitest-environment jsdom
import { act, cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { Desktop } from '../../src/screens/desktop/Desktop';
import { TopBar } from '../../src/screens/desktop/TopBar';
import { barLabel } from '../../src/engine/desktop';
import { deadlineLabel } from '../../src/engine/clock';
import { stageView } from '../../src/engine/missions';
import { setPref } from '../../src/ui/prefs';
import { game } from '../engine/fixtures';
import { day2 } from '../helpers/states';
import { renderWithStore } from './helpers';

let store: ReturnType<typeof renderWithStore>['store'];
beforeEach(() => { store = renderWithStore(<Desktop />).store; });

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
it('Mapa u Kuby: otwiera mapę', async () => {
  await userEvent.click(screen.getByRole('button', { name: /Mapa/ }));
  expect(store.get().screen).toBe('mapPoland');
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
it('termin bez separatora: bez osieroconego „· ”', async () => {
  cleanup();
  const clock = await import('../../src/engine/clock');
  const spy = vi.spyOn(clock, 'deadlineLabel').mockReturnValue({ text: 'czw 19:00', red: false });
  renderWithStore(<TopBar />, day2());
  expect(screen.getByText('czw 19:00')).toBeInTheDocument();
  expect(document.getElementById('dl-left')).toBeNull();
  spy.mockRestore();
});
it('ikony pasków tytułu jak w makiecie (uproszczone dla Notatek, Darknetu, Osiągnięć)', async () => {
  const nav = within(screen.getByRole('navigation', { name: 'Pulpit' }));
  await userEvent.click(nav.getByRole('button', { name: /Osiągnięcia/ }));
  await userEvent.click(nav.getByRole('button', { name: /Darknet/ }));
  await userEvent.click(nav.getByRole('button', { name: /Notatki/ }));
  const tb = (name: string) => screen.getByRole('region', { name }).querySelector('.titlebar svg')!.innerHTML;
  expect(tb('Osiągnięcia')).toBe('<path d="M7 4h10v5a5 5 0 01-10 0zM12 14v4M8 21h8"></path>');
  expect(tb('Darknet')).toBe('<path d="M12 2.5l8 3.5v6c0 5-3.4 8.4-8 9.5-4.6-1.1-8-4.5-8-9.5V6z"></path>');
  expect(tb('Notatki')).toBe('<path d="M6 3h9l4 4v14H6z"></path>');
});
