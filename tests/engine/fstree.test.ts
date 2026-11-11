import { expect, test } from 'vitest';
import { children, resolvePath } from '../../src/engine/fstree';
import { W_TREE } from '../../src/missions/w/server';

test('resolvePath', () => {
  expect(resolvePath('/finanse', 'zestawienia/2026')).toBe('/finanse/zestawienia/2026');
  expect(resolvePath('/finanse/zestawienia', '..')).toBe('/finanse');
  expect(resolvePath('/', '..')).toBe('/');
  expect(resolvePath('/it', '/zarzad/./protokoly')).toBe('/zarzad/protokoly');
});
test('children w kolejności z drzewa', () => {
  expect(children(W_TREE, '/').map(c => c.name)).toEqual(['archiwum', 'finanse', 'it', 'pracownicy', 'zarzad']);
  expect(children(W_TREE, '/finanse/zestawienia/2026').map(c => c.node.kind)).toEqual(['dir', 'file', 'file', 'file']);
  expect(children(W_TREE, '/it')[1]).toMatchObject({ path: '/it/README.txt', node: { kind: 'file', mb: 0.01, author: 'admin' } });
});
test('drzewo: każdy katalog ma swoje dzieci w drzewie', () => {
  for (const [p, n] of Object.entries(W_TREE)) {
    if (n.kind === 'dir') for (const c of children(W_TREE, p)) expect(c.node, c.path).toBeDefined();
  }
});
