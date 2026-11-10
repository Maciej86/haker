// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { createStore } from '../../src/engine/store';
import { game } from '../engine/fixtures';

const renderApp = () => render(<App store={createStore(game(), { persist: null })} fresh />);

function setWidth(w: number) {
  Object.defineProperty(window, 'innerWidth', { value: w, configurable: true });
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
}

describe('App: wybór ekranu', () => {
  it('przy 1023 px pokazuje komunikat dla telefonu', () => {
    setWidth(1023); renderApp();
    expect(screen.getByText('Demo działa na komputerze. Otwórz ten link na komputerze z większym ekranem.')).toBeInTheDocument();
    expect(screen.queryByTestId('game')).toBeNull();
  });
  it('przy 1024 px pokazuje grę', () => {
    setWidth(1024); renderApp();
    expect(screen.getByTestId('game')).toBeInTheDocument();
  });
  it('po poszerzeniu okna gra wraca bez przeładowania', () => {
    setWidth(800); renderApp();
    setWidth(1280);
    expect(screen.getByTestId('game')).toBeInTheDocument();
    expect(screen.queryByText(/Demo działa na komputerze/)).toBeNull();
  });
  it('pokazuje link do gry w polu do skopiowania', () => {
    setWidth(800); renderApp();
    expect(screen.getByRole('textbox', { name: 'Link do gry' })).toHaveValue(window.location.origin + '/haker/');
  });
  it('kopiuje link i pokazuje „Skopiowano”', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    setWidth(800); renderApp();
    await userEvent.click(screen.getByRole('button', { name: 'Kopiuj link' }));
    expect(writeText).toHaveBeenCalledWith(window.location.origin + '/haker/');
    expect(await screen.findByRole('button', { name: 'Skopiowano' })).toBeInTheDocument();
  });
  it('gdy schowek odmawia, nie ma błędu, a link dalej jest w polu', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) }, configurable: true });
    setWidth(800); renderApp();
    await userEvent.click(screen.getByRole('button', { name: 'Kopiuj link' }));
    expect(screen.getByRole('textbox', { name: 'Link do gry' })).toHaveValue(window.location.origin + '/haker/');
    expect(screen.getByRole('button', { name: 'Kopiuj link' })).toBeInTheDocument();
  });
});

describe('App: złożenie gry', () => {
  it('nowa gra: Terminal i Poczta', () => {
    setWidth(1280); render(<App store={createStore(game(), { persist: null })} fresh />);
    expect(screen.getByRole('region', { name: 'Terminal' })).toBeInTheDocument(); expect(screen.getByRole('region', { name: 'Poczta' })).toBeInTheDocument();
  });
  it('wczytany zapis: sam Terminal', () => {
    setWidth(1280); render(<App store={createStore(game(), { persist: null })} fresh={false} />);
    expect(screen.getByRole('region', { name: 'Terminal' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Poczta' })).toBeNull();
  });
  it('niezarejestrowany ekran: zaślepka z powrotem', async () => {
    setWidth(1280); const store = createStore(game({ screen: 'mapPoland' }), { persist: null });
    render(<App store={store} fresh />);
    await userEvent.click(screen.getByRole('button', { name: '✕ wróć na pulpit' })); expect(store.get().screen).toBe('desktop');
  });
  it('bez ?dev=1 nie ma panelu DEV', () => {
    setWidth(1280); render(<App store={createStore(game(), { persist: null })} fresh />); expect(screen.queryByText('DEV:')).toBeNull();
  });
  it('overlay podsumowania nad pulpitem', () => {
    setWidth(1280);
    render(<App store={createStore(game({ overlay: 'summary', summary: [], summaryMeta: { log: [], xp: 5, money: 0, next: 'nextDay' } }), { persist: null })} fresh />);
    expect(screen.getByRole('dialog', { name: 'Misja zakończona' })).toBeInTheDocument();
  });
  it('odpowiedź „po chwili” i toast działają także poza pulpitem', () => {
    vi.useFakeTimers();
    try {
      setWidth(1280); const store = createStore(game({ screen: 'mapPoland' }), { persist: null });
      render(<App store={store} fresh />);
      act(() => store.apply({ state: store.get(), lines: [], ui: [{ kind: 'toast', text: 'Sygnał z daleka' }] }));
      expect(screen.getByText('Sygnał z daleka')).toBeInTheDocument();
    } finally { vi.useRealTimers(); }
  });
});

