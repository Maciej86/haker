// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from '../../src/App';

function setWidth(w: number) {
  Object.defineProperty(window, 'innerWidth', { value: w, configurable: true });
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
}

describe('App: wybór ekranu', () => {
  it('przy 1023 px pokazuje komunikat dla telefonu', () => {
    setWidth(1023); render(<App />);
    expect(screen.getByText('Demo działa na komputerze. Otwórz ten link na komputerze z większym ekranem.')).toBeInTheDocument();
    expect(screen.queryByTestId('game')).toBeNull();
  });
  it('przy 1024 px pokazuje grę', () => {
    setWidth(1024); render(<App />);
    expect(screen.getByTestId('game')).toBeInTheDocument();
  });
  it('po poszerzeniu okna gra wraca bez przeładowania', () => {
    setWidth(800); render(<App />);
    setWidth(1280);
    expect(screen.getByTestId('game')).toBeInTheDocument();
    expect(screen.queryByText(/Demo działa na komputerze/)).toBeNull();
  });
  it('pokazuje link do gry w polu do skopiowania', () => {
    setWidth(800); render(<App />);
    expect(screen.getByRole('textbox', { name: 'Link do gry' })).toHaveValue(window.location.origin + '/haker/');
  });
  it('kopiuje link i pokazuje „Skopiowano”', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    setWidth(800); render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'Kopiuj link' }));
    expect(writeText).toHaveBeenCalledWith(window.location.origin + '/haker/');
    expect(await screen.findByRole('button', { name: 'Skopiowano' })).toBeInTheDocument();
  });
  it('gdy schowek odmawia, nie ma błędu, a link dalej jest w polu', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) }, configurable: true });
    setWidth(800); render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'Kopiuj link' }));
    expect(screen.getByRole('textbox', { name: 'Link do gry' })).toHaveValue(window.location.origin + '/haker/');
    expect(screen.getByRole('button', { name: 'Kopiuj link' })).toBeInTheDocument();
  });
});
