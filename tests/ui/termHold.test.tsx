// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { useState } from 'react';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Terminal } from '../../src/apps/terminal/Terminal';
import { clearTermHold } from '../../src/apps/terminal/hold';
import { runLine } from '../../src/engine/terminal';
import { deserialize, serialize } from '../../src/engine/state';
import { useRestart } from '../../src/ui/restart';
import { ToastHost } from '../../src/ui/Toast';
import type { GameState } from '../../src/engine/types';
import { kubaAccepted, withKuba } from '../missions/kuba/helpers';
import { Probe, renderWithStore } from './helpers';

const onZenek = (): GameState =>
  runLine(withKuba({ ...kubaAccepted(), owned: ['cpu1', 'net2', 'wyt'] }, { conn: true, cracked: true }), 'connect 83.21.40.17').state;

const input = () => screen.getByLabelText('Polecenie') as HTMLInputElement;
const type = (cmd: string) => {
  fireEvent.change(input(), { target: { value: cmd } });
  fireEvent.keyDown(input(), { key: 'Enter' });
};
const bars = () => [...document.querySelectorAll<HTMLElement>('#term .dl i')];
const lastBar = () => bars().at(-1)!;
const DONE = 'Pobrano: playlista.txt';
const TOAST = 'Pobrano playlista.txt';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { act(() => clearTermHold()); vi.useRealTimers(); });

it('get: pole wyłączone, pasek 0→25→50→75→100%, „Pobrano” i toast dopiero po 1000 ms, potem fokus', () => {
  renderWithStore(<><ToastHost /><Probe /><Terminal /></>, onZenek());
  act(() => type('get playlista.txt'));
  expect(input()).toBeDisabled();
  expect(screen.getByText('Pobieranie playlista.txt (4 KB)…')).toBeInTheDocument();
  expect(lastBar().style.width).toBe('0%');
  expect(screen.queryByText(DONE)).toBeNull();
  for (const w of ['25%', '50%', '75%']) {
    act(() => vi.advanceTimersByTime(250));
    expect(lastBar().style.width).toBe(w);
    expect(screen.queryByText(DONE)).toBeNull();
    expect(screen.queryByText(TOAST)).toBeNull();
    expect(input()).toBeDisabled();
  }
  act(() => vi.advanceTimersByTime(250));
  expect(screen.getAllByText(DONE)).toHaveLength(1);
  expect(screen.getAllByText(TOAST)).toHaveLength(1);
  expect(input()).not.toBeDisabled();
  expect(input()).toHaveFocus();
  expect(lastBar().style.width).toBe('');
  act(() => vi.advanceTimersByTime(2000));
  expect(screen.getAllByText(DONE)).toHaveLength(1);
});

it('zamknięcie i ponowne otwarcie okna w trakcie: „Pobrano” raz, toast raz, pasek nie startuje od zera', () => {
  let toggle = () => {};
  function Win() { const [on, set] = useState(true); toggle = () => set((x) => !x); return on ? <Terminal /> : null; }
  const { store } = renderWithStore(<><ToastHost /><Probe /><Win /></>, onZenek());
  act(() => type('get playlista.txt'));
  act(() => vi.advanceTimersByTime(500));
  act(() => toggle());
  act(() => vi.advanceTimersByTime(250));
  act(() => toggle());
  expect(lastBar().style.width).toBe('75%');
  act(() => vi.advanceTimersByTime(250));
  expect(screen.getAllByText(DONE)).toHaveLength(1);
  expect(screen.getAllByText(TOAST)).toHaveLength(1);
  expect(store.get().terminal.lines.filter((l) => l.html.includes(DONE))).toHaveLength(1);
});

it('odświeżenie w trakcie (nowy magazyn bez wstrzymania): pełny pasek i „Pobrano” raz', () => {
  const { store } = renderWithStore(<><Probe /><Terminal /></>, onZenek());
  act(() => type('get playlista.txt'));
  act(() => vi.advanceTimersByTime(500));
  const saved = deserialize(serialize(store.get()))!;
  cleanup(); clearTermHold();
  renderWithStore(<><Probe /><Terminal /></>, saved);
  expect(screen.getAllByText(DONE)).toHaveLength(1);
  expect(lastBar().style.width).toBe('');
  expect(input()).not.toBeDisabled();
});

it('stare paski w historii są statyczne i pełne (bez animacji CSS)', () => {
  renderWithStore(<><ToastHost /><Probe /><Terminal /></>, onZenek());
  act(() => type('get playlista.txt'));
  act(() => vi.advanceTimersByTime(1000));
  act(() => type('get podpowiedz_hasla.txt'));
  act(() => vi.advanceTimersByTime(250));
  expect(bars()).toHaveLength(2);
  expect(bars()[0].style.width).toBe('');
  expect(bars()[1].style.width).toBe('25%');
  const css = readFileSync('src/apps/terminal/Terminal.css', 'utf8');
  expect(css).not.toMatch(/animation|@keyframes/);
  expect(css).toMatch(/#term \.dl i\{[^}]*width:100%/);
});

it('nowa gra kasuje trwające pobieranie: bez „Pobrano”, bez toastu, pole włączone', () => {
  let restart = () => {};
  function Sonda() { restart = useRestart(); return null; }
  renderWithStore(<><ToastHost /><Probe /><Sonda /><Terminal /></>, onZenek());
  act(() => type('get playlista.txt'));
  act(() => vi.advanceTimersByTime(500));
  act(() => restart());
  act(() => vi.advanceTimersByTime(2000));
  expect(screen.queryByText(TOAST)).toBeNull();
  expect(screen.queryByText(DONE)).toBeNull();
  expect(input()).not.toBeDisabled();
});
