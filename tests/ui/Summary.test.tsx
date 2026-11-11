// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Summary } from '../../src/screens/overlays/Summary';
import { End } from '../../src/screens/overlays/End';
import { Pause } from '../../src/screens/overlays/Pause';
import { NEXT_DAY_T } from '../../src/engine/clock';
import type { GameState, SummaryRow } from '../../src/engine/types';
import { game } from '../engine/fixtures';
import { deserialize, serialize } from '../../src/engine/state';
import { hideMail } from '../../src/apps/mail/delayed';
import { startTermHold, useTermHold } from '../../src/apps/terminal/hold';
import { walk } from '../../src/apps/plan/walk';
import { renderHook } from '@testing-library/react';

const useTermHoldSnapshot = () => renderHook(() => useTermHold()).result.current;
import { renderWithStore } from './helpers';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

const meta = { log: ['> Plik dostarczony: playlista.txt', '> Kuba potwierdził odbiór.'], xp: 80, money: 300, next: 'nextDay' as const };
const rows: SummaryRow[] = [{ label: 'Nagroda za zlecenie', value: '300 ¤', tone: 'ok' }, { label: 'Umiejętności w tej misji', value: '', tone: 'dim' }];
const done = (patch: Partial<GameState> = {}) => game({ done: ['kuba'], overlay: 'summary', summary: rows, summaryMeta: meta, ...patch });

it('bez overlayu nic nie rysuje', () => {
  renderWithStore(<><Summary /><End /></>);
  expect(screen.queryByRole('dialog')).toBeNull();
});
it('log linia po linii, nagłówek i pozycje', () => {
  renderWithStore(<Summary />, done());
  expect(screen.getByRole('dialog', { name: 'Misja zakończona' })).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(350)); expect(screen.getByText(/> Plik dostarczony/)).toBeInTheDocument(); expect(screen.queryByText(/Kuba potwierdził/)).toBeNull();
  act(() => vi.advanceTimersByTime(350)); expect(screen.getByText(/Kuba potwierdził/)).toBeInTheDocument();
  expect(screen.getByText('+80 XP')).toBeInTheDocument(); expect(screen.getByText('Nagroda za zlecenie').closest('.bon')).toHaveClass('ok');
  expect(screen.queryByText('+120 XP')).toBeNull();
});
it('Następny dzień', () => {
  const { store } = renderWithStore(<Summary />, done());
  fireEvent.click(screen.getByRole('button', { name: 'Następny dzień ›' }));
  expect(store.get()).toMatchObject({ day: 'czw', t: NEXT_DAY_T, overlay: null });
});
it('Następny dzień: podwójne kliknięcie przesuwa tylko o jeden dzień', () => {
  const { store } = renderWithStore(<Summary />, done());
  const b = screen.getByRole('button', { name: 'Następny dzień ›' });
  fireEvent.click(b); fireEvent.click(b);
  expect(store.get().day).toBe('czw');
});
it('Koniec demo, potem Zagraj od nowa', () => {
  const { store } = renderWithStore(<><Summary /><End /></>, done({ done: ['kuba', 'w', 'm3'], summaryMeta: { ...meta, next: 'end' } }));
  fireEvent.click(screen.getByRole('button', { name: 'Koniec demo ›' }));
  expect(store.get().overlay).toBe('end'); expect(screen.getByText('Ukończone zlecenia', { exact: false })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Zagraj od nowa' }));
  expect(store.get()).toMatchObject({ done: [], overlay: null });
});
it('porażka: Spróbuj od nowa (ten sam dzień)', () => {
  const { dayCheckpoint: _, ...cp } = game({ money: 321 });
  const { store } = renderWithStore(<Summary />, done({ failed: true, summaryMeta: { log: ['> Zlecenie nieudane.'], xp: 0, money: 0, next: 'retry' }, dayCheckpoint: cp }));
  expect(screen.getByText('0 XP')).toBeInTheDocument(); expect(screen.queryByRole('button', { name: 'Zamknij' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Spróbuj od nowa (ten sam dzień)' })); expect(store.get().money).toBe(321);
});
it('porażka: jedyny przycisk to Spróbuj od nowa, także po wczytaniu zapisu', () => {
  const failed = done({ failed: true, summaryMeta: { log: [], xp: 0, money: 0, next: 'retry' } });
  const loaded = deserialize(serialize(failed))!;
  expect(loaded).toMatchObject({ failed: true, overlay: 'summary' });
  renderWithStore(<Summary />, loaded);
  expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['Spróbuj od nowa (ten sam dzień)']);
});
it('porażka: Spróbuj od nowa przerywa zaległy mail, wstrzymanie Terminala i pokaz na planie', () => {
  const { dayCheckpoint: _, ...cp } = game({ money: 321 });
  renderWithStore(<Summary />, done({ failed: true, summaryMeta: { log: [], xp: 0, money: 0, next: 'retry' }, dayCheckpoint: cp }));
  const mail = vi.fn(); const walked = vi.fn();
  act(() => {
    hideMail('m3', 'odp', 1000, mail);
    startTermHold({ ms: 1000, steps: 2, after: [] });
    walk.start({ path: [[0, 0], [10, 10]], stopAt: 1, ms: 1000, holdMs: 0 }, walked);
  });
  expect(walk.get()).not.toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Spróbuj od nowa (ten sam dzień)' }));
  act(() => vi.advanceTimersByTime(5000));
  expect([mail, walked].map((f) => f.mock.calls.length)).toEqual([0, 0]);
  expect(walk.get()).toBeNull();
  expect(useTermHoldSnapshot()).toBeNull();
});
it('Pause: klik wznawia', () => {
  const onResume = vi.fn(); render(<Pause onResume={onResume} />);
  fireEvent.click(screen.getByText('Pauza · kliknij, żeby wrócić do gry')); expect(onResume).toHaveBeenCalled();
});
