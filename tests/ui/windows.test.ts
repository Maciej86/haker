import { expect, it } from 'vitest';
import type { AppId } from '../../src/engine/types';
import { EMPTY_WINS, activeWin, closeWin, focusWin, moveWin, openWin, place, resizeWin, zIndex, type Rect } from '../../src/ui/windows';

const T: Rect = { x: 220, y: 64, w: 680, h: 440 };
it('otwieranie, wierzch, zamykanie', () => {
  let ws = openWin(openWin(EMPTY_WINS, 'terminal', T), 'mail', T);
  expect(activeWin(ws)).toBe('mail');
  ws = focusWin(ws, 'terminal'); expect(ws.order).toEqual(['mail', 'terminal']);
  expect(openWin(ws, 'mail', { x: 0, y: 0, w: 1, h: 1 }).rects.mail).toEqual(T);
  expect(closeWin(ws, 'mail').order).toEqual(['terminal']);
});
it('z-index < 50 przy wszystkich 12 oknach', () => {
  const all: AppId[] = ['terminal','mail','notes','help','netmap','wytrych','browser','darknet','achievements','downloads','plan','clock'];
  const ws = all.reduce((w, a) => openWin(w, a, T), EMPTY_WINS);
  expect(Math.max(...all.map(a => zIndex(ws, a)))).toBe(22);
});
it('przeciąganie zatrzymuje się na pasku i lewej krawędzi', () => {
  expect(moveWin(openWin(EMPTY_WINS, 'terminal', T), 'terminal', -50, 10).rects.terminal).toMatchObject({ x: 0, y: 44 });
});
it('minimum 320×180', () => { expect(resizeWin(openWin(EMPTY_WINS, 'mail', T), 'mail', 100, 100).rects.mail).toMatchObject({ w: 320, h: 180 }); });
it('place obok Terminala', () => {
  expect(place(T, 1920, 1080)).toEqual({ x: 912, y: 58, w: 746, h: 966 });
  expect(place(T, 2560, 1440)).toEqual({ x: 912, y: 58, w: 1100, h: 1326 });
  expect(place(T, 1600, 900)).toBeNull(); expect(place(null, 2560, 1440)).toBeNull();
});
