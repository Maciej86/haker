import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { runLine } from '../../engine/terminal';
import { catHtml, closeMc, closePreview, mcInfo, mcRows, mcStatus } from '../../engine/mc';
import { onServer, srvHost } from '../../engine/server';
import { useGame, useStore } from '../../ui/useGame';
import { EditorView } from './EditorView';

/** Klawisze widoku mc (misja.html 1402–1404); reszta trafia dalej. */
const KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', 'Home', 'F3', 'F4', 'F5', 'F8', 'F10'];
const FK: [string, string, string][] = [['F3', 'F3', 'Podgląd'], ['F4', 'F4', 'Edycja'], ['F5', 'F5', 'Pobierz'], ['F8', 'F8', 'Usuń'], ['F10', 'F10', 'Wyjście']];

const cwdOf = (l: { kind: string; path?: string }) => (l.kind === 'host' && l.path ? l.path : '/');

// misja.html linie 1336–1382: dwa panele, podgląd F3, edytor auth.log. Każda akcja to polecenie Terminala (echo i koszt).
export function McView() {
  const s = useGame((x) => x);
  const store = useStore();
  const [sel, setSel] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const editing = s.srv.editor !== null;
  const server = onServer(s);

  useEffect(() => { if (!editing) root.current?.focus(); }, [editing]);

  if (!server) return null;
  if (editing) return <EditorView />;

  const rows = mcRows(s);
  const cur = Math.max(0, Math.min(sel, rows.length - 1));
  const row = rows[cur] ?? null;
  const preview = s.srv.mc.preview;

  const run = (cmd: string) => store.apply(runLine(store.get(), cmd));
  const back = () => {
    const from = cwdOf(store.get().terminal.location);
    run('cd ..');
    setSel(Math.max(0, mcRows(store.get()).findIndex((r) => r.path === from)));
  };

  const key = (k: string) => {
    if (preview) {
      if (k === 'Escape' || k === 'F3' || k === 'F10') store.apply(closePreview(store.get()));
      return;
    }
    if (k === 'ArrowDown') return setSel(Math.min(rows.length - 1, cur + 1));
    if (k === 'ArrowUp') return setSel(Math.max(0, cur - 1));
    if (k === 'Home') return setSel(0);
    if (k === 'F10' || k === 'Escape') return store.apply(closeMc(store.get()));
    if (!row) return;
    if (k === 'Enter' || k === 'ArrowRight') {
      if (row.up) return back();
      if (row.dir) { run('cd ' + row.name); return setSel(0); }
      if (!store.get().srv.known.includes(row.name)) run('info ' + row.name);
      return;
    }
    if (k === 'ArrowLeft') { if (cwdOf(store.get().terminal.location) !== '/') back(); return; }
    if (row.dir) return;
    if (k === 'F3') return run('cat ' + row.name);
    if (k === 'F4') return run('edit ' + row.name);
    if (k === 'F5') return run('get ' + row.name);
    if (k === 'F8') return run('rm ' + row.name);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!KEYS.includes(e.key)) return;
    e.preventDefault();
    key(e.key);
  };
  const press = (k: string) => { key(k); root.current?.focus(); };

  if (preview) {
    return (
      <div className="mc" ref={root} tabIndex={-1} onKeyDown={onKey}>
        <div className="ph ph-box">podgląd: {preview}</div>
        <div className="view" dangerouslySetInnerHTML={{ __html: catHtml(s, preview) }} />
        <div className="mcmd" dangerouslySetInnerHTML={{ __html: mcStatus(s) }} />
        <div className="fk"><button type="button" onClick={() => press('Escape')}><i>Esc</i>Wróć</button></div>
      </div>
    );
  }

  const host = srvHost(s)!;
  return (
    <div className="mc" ref={root} tabIndex={-1} onKeyDown={onKey}>
      <div className="panes">
        <div className="pane">
          <div className="ph">{host.ip}:{cwdOf(s.terminal.location)}</div>
          {rows.map((r, i) => (
            <div key={r.path + i} className={['row', r.dir && 'dir', i === cur && 'sel', r.got && 'got'].filter(Boolean).join(' ')}
              onClick={() => { setSel(i); root.current?.focus(); }}
              onDoubleClick={() => { setSel(i); root.current?.focus(); if (i === cur) key('Enter'); }}>
              <span>{r.up ? '/..' : r.dir ? '/' + r.name : r.name}</span><small>{r.small}</small>
            </div>
          ))}
        </div>
        <div className="pane">
          <div className="ph">~/Pobrane (ten komputer)</div>
          <div className="row dir"><span>/..</span><small /></div>
          {s.downloads.length
            ? s.downloads.map((f) => <div key={f.fileId} className="row"><span>{f.name}</span><small /></div>)
            : <div className="row"><span className="dimtxt">pusto</span></div>}
        </div>
      </div>
      <div className="info" dangerouslySetInnerHTML={{ __html: mcInfo(s, row) }} />
      <div className="mcmd" dangerouslySetInnerHTML={{ __html: mcStatus(s) }} />
      <div className="fk">
        {FK.map(([k, label, text]) => <button key={k} type="button" onClick={() => press(k)}><i>{label}</i>{text}</button>)}
      </div>
    </div>
  );
}
