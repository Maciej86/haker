import { useRef } from 'react';
import type { SummaryRow } from '../../engine/types';
import { nextDay } from '../../engine/clock';
import { retryDay } from '../../engine/missions';
import { fmt } from '../../engine/text';
import { useGame, useStore } from '../../ui/useGame';
import { TypedLog } from './TypedLog';
import './Overlay.css';

// Wiersze po nagłówku sekcji (tone 'dim', np. „Umiejętności w tej misji”) mają układ z misja.html linia 1334.
export function SummaryRows({ rows }: { rows: SummaryRow[] }) {
  let section = false;
  return (
    <div className="bons">
      {rows.map((r, i) => {
        if (r.tone === 'dim') { section = true; return <div key={i} className="sec">{r.label}</div>; }
        const cls = ['bon', r.tone, section && 'sk'].filter(Boolean).join(' ');
        return <div key={i} className={cls}><span>{r.label}</span><span>{r.value}</span></div>;
      })}
    </div>
  );
}

// misja.html linie 582–584, 1318–1329, 1841–1846
export function Summary() {
  const store = useStore();
  const overlay = useGame((s) => s.overlay);
  const meta = useGame((s) => s.summaryMeta);
  const rows = useGame((s) => s.summary);
  const busy = useRef(false);
  if (overlay !== 'summary' || !meta) { busy.current = false; return null; }

  // Porażka nie ma „Zamknij”: jedyne wyjście to powtórka dnia (bez niej oferty i oddanie byłyby zablokowane).
  // Jedno kliknięcie = jedna akcja, nawet gdy drugi klik przyjdzie przed odświeżeniem widoku.
  const once = (f: () => void) => () => {
    if (busy.current || store.get().overlay !== 'summary') return;
    busy.current = true;
    f();
  };
  const retry = meta.next === 'retry';

  return (
    <div className="ovl" role="dialog" aria-label="Misja zakończona">
      <div className="card">
        <TypedLog lines={meta.log} />
        <div className="xp">
          {retry
            ? <><b style={{ color: 'var(--red)' }}>0 XP</b><span>0 ¤</span></>
            : <><b>+{meta.xp} XP</b><span><i className="coin">¤</i>+{fmt(meta.money)}</span></>}
        </div>
        {retry ? (
          <div className="retry">
            <button className="btn" onClick={once(() => store.apply(retryDay(store.get())))}>Spróbuj od nowa (ten sam dzień)</button>
          </div>
        ) : null}
        <SummaryRows rows={rows ?? []} />
        <div className="acts">
          {meta.next === 'nextDay' ? <button className="btn" onClick={once(() => store.apply(nextDay(store.get())))}>Następny dzień ›</button> : null}
          {meta.next === 'end' ? <button className="btn" onClick={once(() => store.apply({ ...store.get(), overlay: 'end' }))}>Koniec demo ›</button> : null}
        </div>
      </div>
    </div>
  );
}
