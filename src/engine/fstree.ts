// Drzewo plików serwera z folderami (plan 21). Klucz: ścieżka absolutna.
export type TreeFile = {
  kind: 'file'; name: string; mb: number; date: string; author: string;
  approved: string; notes: string; tag: string; body: string;   // tag 'log' = plik logu z srv.log
};
export type TreeNode = { kind: 'dir'; children: string[] } | TreeFile;
export type Tree = Record<string, TreeNode>;

/** Ścieżka absolutna z `arg` względem `cwd`; '..' w '/' zostaje w '/' (misja.html 1243–1244). */
export function resolvePath(cwd: string, arg: string): string {
  const parts = arg.startsWith('/') ? [] : cwd.split('/').filter(Boolean);
  for (const p of arg.split('/').filter(Boolean)) {
    if (p === '..') parts.pop();
    else if (p !== '.') parts.push(p);
  }
  return '/' + parts.join('/');
}

/** Dzieci katalogu w kolejności z drzewa (misja.html 1245). */
export function children(tree: Tree, dir: string): { path: string; name: string; node: TreeNode }[] {
  const n = tree[dir];
  if (!n || n.kind !== 'dir') return [];
  return n.children.map((name) => {
    const path = (dir === '/' ? '' : dir) + '/' + name;
    return { path, name, node: tree[path] };
  });
}
