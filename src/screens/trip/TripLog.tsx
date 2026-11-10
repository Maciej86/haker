// Dziennik wyjazdu (wyjazd.tpl.html 163, `log`). Wpisy to HTML z tekstów gry (TRIP_TEXT).
import { useLayoutEffect, useRef } from 'react';
import { hm } from './timing';

export type LogEntry = { t: number; html: string; cls?: '' | 'dim' | 'acc' | 'red' };

export function TripLog({ entries }: { entries: LogEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => { if (ref.current) ref.current.scrollTop = 1e9; }, [entries.length]);
  return (
    <div className="log" ref={ref}>
      {entries.map((e, i) => (
        <div key={i}><time>{hm(e.t)}</time><span className={e.cls || undefined} dangerouslySetInnerHTML={{ __html: e.html }} /></div>
      ))}
    </div>
  );
}
