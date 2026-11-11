// @vitest-environment jsdom
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it } from 'vitest';
import { NetMap } from '../../src/apps/netmap/NetMap';
import { APPS } from '../../src/apps/registry';
import { acceptOffer } from '../../src/engine/missions';
import { runLine } from '../../src/engine/terminal';
import { step } from '../../src/engine/types';
import { afterKuba, atS1 } from '../engine/netHelpers';
import { withMission } from '../engine/fixtures';
import { Probe, renderWithStore } from './helpers';

let restore = () => {};
afterEach(() => restore());
const start = () => runLine(acceptOffer(afterKuba([atS1(60)]), 'w').state, 'use S1').state;
const nd = (c: HTMLElement, ip: string) => c.querySelector(`.nd[data-ip="${ip}"]`) as HTMLElement;

it('rejestracja i tytuł okna', () => {
  expect(APPS.netmap.component).toBe(NetMap);
  const s = start();
  expect(APPS.netmap.winTitle!(s)).toBe('NetMap 1.0 · schemat sieci');
  expect(APPS.netmap.winTitle!(runLine(s, 'scan').state)).toBe('NetMap 1.0 · schemat sieci · za skrzynką S1');
});

it('bez skanu: Brak danych; po skanie drzewo z gałęziami i 21 urządzeniami', () => {
  const { store, container } = renderWithStore(<NetMap />, start());
  expect(screen.getByText(/Brak danych\./)).toBeInTheDocument();
  expect(screen.getByText('6 min gry · 3 min urządzenia')).toBeInTheDocument();
  act(() => store.apply(runLine(store.get(), 'scan')));
  expect(screen.queryByText(/Brak danych\./)).toBeNull();
  expect(container.querySelector('.s1box')!.textContent).toBe('S1PODSŁUCH-1Poznań-Centrum');
  expect(container.querySelectorAll('.br')).toHaveLength(7);
  expect(container.querySelectorAll('.nd')).toHaveLength(21);
  expect(container.querySelectorAll('.nd')[0].querySelectorAll('.spark i')).toHaveLength(24);
  expect(container.querySelectorAll('.nd')[0].querySelectorAll('.spark i.now')).toHaveLength(1);
  expect(screen.getByText('Kliknij urządzenie na schemacie. Żółty słupek na wykresie aktywności to bieżąca godzina.')).toBeInTheDocument();
});

it('zaznaczenie, skreślenie i Sprawdź w Terminalu', async () => {
  const user = userEvent.setup();
  const { store, container } = renderWithStore(<><NetMap /><Probe /></>, runLine(start(), 'scan').state);
  await user.click(nd(container, '10.42.7.12'));
  expect(nd(container, '10.42.7.12')).toHaveClass('sel');
  const det = container.querySelector('.det') as HTMLElement;
  expect(within(det).getByText('◆ serwer')).toBeInTheDocument();
  expect(within(det).getByText('przełącznik C · 10.42.7.x')).toBeInTheDocument();
  expect(det.querySelectorAll('.chart i')).toHaveLength(24);
  await user.click(within(det).getByRole('button', { name: /Skreśl/ }));
  expect(store.get().net.crossed).toEqual(['10.42.7.12']);
  expect(nd(container, '10.42.7.12')).toHaveClass('x');
  expect(within(det).getByRole('button', { name: 'Sprawdź w Terminalu ›' })).toBeDisabled();
  await user.click(within(det).getByRole('button', { name: /Przywróć/ }));
  expect(store.get().net.crossed).toEqual([]);
  await user.click(within(det).getByRole('button', { name: 'Sprawdź w Terminalu ›' }));
  expect(screen.getByTestId('input')).toHaveTextContent('probe 10.42.7.12');
});

it('sprawdzony: trafienie hit, chybienie bad, bez przycisków', async () => {
  const user = userEvent.setup();
  let s = runLine(start(), 'scan').state;
  s = runLine(runLine(s, 'probe 10.42.7.12').state, 'probe 10.42.2.3').state;
  const { container } = renderWithStore(<NetMap />, s);
  expect(nd(container, '10.42.7.12')).toHaveClass('hit');
  expect(nd(container, '10.42.7.12').querySelector('.who')!.textContent).toMatch(/^✓ /);
  expect(nd(container, '10.42.2.3')).toHaveClass('bad');
  expect(nd(container, '10.42.2.3').querySelector('.who')!.textContent).toMatch(/^✗ /);
  await user.click(nd(container, '10.42.2.3'));
  const det = container.querySelector('.det') as HTMLElement;
  expect(within(det).getByText('to jest')).toBeInTheDocument();
  expect(within(det).queryByRole('button', { name: /Skreśl/ })).toBeNull();
});

it('filtr z Terminala: pasek, inf/off, wyczyść', async () => {
  const user = userEvent.setup();
  const s = runLine(runLine(start(), 'scan').state, 'scan --net 10.42.7').state;
  const { store, container } = renderWithStore(<NetMap />, s);
  const filt = container.querySelector('.filt') as HTMLElement;
  expect(filt.textContent).toMatch(/^Filtr z Terminala: scan --net 10\.42\.7 · pasuje \d+ z 21/);
  expect(nd(container, '10.42.7.12')).toHaveClass('inf');
  expect(nd(container, '10.42.2.3')).toHaveClass('off');
  await user.click(within(filt).getByRole('button', { name: 'wyczyść' }));
  expect(store.get().net.filter).toBeNull();
  expect(container.querySelector('.filt')).toBeNull();
});

it('panel misji: top i podpowiedzi z przyciskami, targetFound chowa akcje', async () => {
  const user = userEvent.setup();
  restore = withMission('w', { network: {
    isTarget: (_s, n) => n.ip === '10.42.7.12',
    targetFound: () => true,
    side: () => ({
      top: { html: '<b>Cel znaleziony</b>', buttons: [{ label: 'Włam się ›', hint: 'wpisze <code>crack</code>', cmd: 'crack 10.42.7.12' }] },
      hints: { html: 'podpowiedź A', buttons: [{ label: 'Kup', act: (st) => step({ ...st, money: st.money - 15 }) }] },
    }),
  } });
  const s = runLine(start(), 'scan').state;
  const { store, container } = renderWithStore(<><NetMap /><Probe /></>, s);
  expect(screen.getByText('Cel znaleziony')).toBeInTheDocument();
  await user.click(nd(container, '10.42.2.3'));
  expect(within(container.querySelector('.det') as HTMLElement).queryByRole('button', { name: /Skreśl/ })).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Włam się ›' }));
  expect(screen.getByTestId('input')).toHaveTextContent('crack 10.42.7.12');
  expect(screen.getByText('podpowiedź A')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Kup' }));
  expect(store.get().money).toBe(s.money - 15);
});
