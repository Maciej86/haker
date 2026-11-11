// Widok plików serwera (plan 21): podgląd pliku. Reszta widoku mc w planie 21, Task 8.
import type { GameState } from './types';
import { esc } from './text';
import { treeHost } from './server';

/** Treść pliku do Terminala i podglądu F3 (linia 1267); auth.log z wierszy `srv.log`. */
export function catHtml(s: GameState, path: string): string {
  const f = treeHost(s)?.tree?.[path];
  if (!f || f.kind !== 'file') return '';
  if (f.tag === 'log') return esc(s.srv.log.map((l) => l.t).join('\n'));
  return `<span class="d">── ${f.name} ──</span>\n${esc(f.body)}`;
}
