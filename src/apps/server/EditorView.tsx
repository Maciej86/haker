import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { editorAct, editorHead, mcStatus, type EditorAction } from '../../engine/mc';
import { useGame, useStore } from '../../ui/useGame';

// misja.html linie 1383–1399: edytor auth.log w oknie Terminala. Strzałki za darmo, Ctrl+K/Delete +1%, F2 +3%.
export function EditorView() {
  const s = useGame((x) => x);
  const store = useStore();
  const work = s.srv.editor?.work ?? [];
  const [sel, setSel] = useState(() => Math.max(0, work.length - 1));
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => { root.current?.focus(); }, []);

  const head = editorHead(s);
  if (!s.srv.editor || !head) return null;
  const cur = Math.max(0, Math.min(sel, work.length - 1));
  const act = (a: EditorAction) => store.apply(editorAct(store.get(), a));

  const key = (k: string) => {
    if (k === 'ArrowDown') return setSel(Math.min(work.length - 1, cur + 1));
    if (k === 'ArrowUp') return setSel(Math.max(0, cur - 1));
    if (k === 'Delete' || k === 'ctrl+k') {
      act({ kind: 'del', index: cur });
      return setSel(Math.max(0, Math.min(cur, work.length - 2)));
    }
    if (k === 'F2') return act({ kind: 'save' });
    if (k === 'Escape' || k === 'F10') return act({ kind: 'quit' });
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const k = e.ctrlKey && e.key.toLowerCase() === 'k' ? 'ctrl+k' : e.key;
    if (!['ArrowUp', 'ArrowDown', 'Delete', 'ctrl+k', 'F2', 'Escape', 'F10'].includes(k)) return;
    e.preventDefault();
    key(k);
  };
  const press = (k: string) => { key(k); root.current?.focus(); };

  return (
    <div className="mc" ref={root} tabIndex={-1} onKeyDown={onKey}>
      <div className="ph ph-box">edycja: {head.file}{s.srv.editor.dirty && <span className="coin"> · niezapisane zmiany</span>}</div>
      <div className="view">
        {work.length
          ? work.map((l, i) => (
            <div key={l.id} className={i === cur ? 'ln sel' : 'ln'} onClick={() => { setSel(i); root.current?.focus(); }}>
              {l.me ? <span className="me">{l.t}</span> : l.t}
            </div>
          ))
          : <span className="dimtxt">(pusto)</span>}
      </div>
      <div className="mcmd">
        <span dangerouslySetInnerHTML={{ __html: mcStatus(s) }} /> <span className="d">· twój adres w sieci banku: {head.me}</span>
      </div>
      <div className="fk">
        <button type="button" onClick={() => press('Delete')}><i>Ctrl+K</i>Usuń wiersz</button>
        <button type="button" onClick={() => press('F2')}><i>F2</i>Zapisz</button>
        <button type="button" onClick={() => press('Escape')}><i>Esc</i>Wyjdź</button>
      </div>
    </div>
  );
}
