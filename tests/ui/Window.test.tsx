// @vitest-environment jsdom
import { fireEvent, screen, within } from '@testing-library/react';
import { useEffect } from 'react';
import { beforeEach, expect, it } from 'vitest';
import { Window } from '../../src/ui/Window';
import { useWindows } from '../../src/ui/windows';
import type { AppId } from '../../src/engine/types';
import { renderWithStore } from './helpers';

const NAMES: Partial<Record<AppId, string>> = { terminal: 'Terminal', mail: 'Poczta' };
function Sonda() {
  const w = useWindows();
  useEffect(() => { w.open('terminal'); w.open('mail'); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <>{w.order.map(a => <Window key={a} app={a} label={NAMES[a]!} title={NAMES[a]!} icon=""><i /></Window>)}</>;
}
beforeEach(() => { renderWithStore(<Sonda />); });

it('kliknięcie przenosi na wierzch', () => {
  const term = screen.getByRole('region', { name: 'Terminal' });
  fireEvent.pointerDown(term);
  expect(term).toHaveClass('active');
  expect(Number(term.style.zIndex)).toBeGreaterThan(Number(screen.getByRole('region', { name: 'Poczta' }).style.zIndex));
});
it('✕ zamyka', () => {
  fireEvent.click(within(screen.getByRole('region', { name: 'Poczta' })).getByRole('button', { name: 'Zamknij' }));
  expect(screen.queryByRole('region', { name: 'Poczta' })).toBeNull();
});
it('przeciąganie za pasek tytułu', () => {
  const win = screen.getByRole('region', { name: 'Terminal' }); const bar = win.querySelector('.titlebar')!;
  fireEvent.pointerDown(bar, { clientX: 300, clientY: 100, pointerId: 1 });
  fireEvent.pointerMove(bar, { clientX: 400, clientY: 150, pointerId: 1 });
  expect([win.style.left, win.style.top]).toEqual(['320px', '114px']);
  fireEvent.pointerMove(bar, { clientX: 10, clientY: 10, pointerId: 1 });
  expect([win.style.left, win.style.top]).toEqual(['0px', '44px']);
  fireEvent.pointerUp(bar, { pointerId: 1 });
  fireEvent.pointerMove(bar, { clientX: 600, clientY: 600, pointerId: 1 });
  expect(win.style.left).toBe('0px');
});
it('przeciąganie tylko lewym przyciskiem', () => {
  const win = screen.getByRole('region', { name: 'Terminal' }); const bar = win.querySelector('.titlebar')!;
  const before = [win.style.left, win.style.top];
  fireEvent.pointerDown(bar, { clientX: 300, clientY: 100, pointerId: 1, button: 2 });
  fireEvent.pointerMove(bar, { clientX: 400, clientY: 150, pointerId: 1 });
  expect([win.style.left, win.style.top]).toEqual(before);
});
it('nie da się wyrzucić okna za prawą i dolną krawędź', () => {
  const win = screen.getByRole('region', { name: 'Terminal' }); const bar = win.querySelector('.titlebar')!;
  fireEvent.pointerDown(bar, { clientX: 300, clientY: 100, pointerId: 1 });
  fireEvent.pointerMove(bar, { clientX: 5000, clientY: 5000, pointerId: 1 });
  expect([win.style.left, win.style.top]).toEqual([`${window.innerWidth - 80}px`, `${window.innerHeight - 30}px`]);
});
