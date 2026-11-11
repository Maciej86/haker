import { expect, test } from 'vitest';
import { ROT, genBoard, powered } from '../../src/engine/wires';

test('ROT', () => { expect([ROT(1), ROT(8), ROT(5)]).toEqual([2, 1, 10]); });
test('genBoard: deterministyczna, 5×7, rozwiązanie łączy S1 z .12, start nierozwiązany', () => {
  const b = genBoard(42);
  expect(genBoard(42)).toEqual(b);
  expect([b.board.length, b.board[0].length]).toEqual([5, 7]);
  expect(b.board.flat().every(m => m > 0)).toBe(true);
  expect(powered(b.sol, b.inRow, b.outRow).win).toBe(true);
  expect(powered(b.board, b.inRow, b.outRow).win).toBe(false);
  expect(genBoard(43).board).not.toEqual(b.board);
});
test('powered: klucze r,c od wejścia', () => {
  const b = genBoard(7);
  const p = powered(b.sol, b.inRow, b.outRow);
  expect(p.set).toContain(`${b.inRow},0`);
  expect(p.set).toContain(`${b.outRow},6`);
});
