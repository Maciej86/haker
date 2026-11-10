// Koniec wyjazdu: wynik (wyjazd.tpl.html 409–410) i karta „Postęp zlecenia” (411–413).
import { useState } from 'react';
import type { TripDef } from '../../engine/trip';
import { fill } from '../../engine/text';
import { TRIP_TEXT } from '../../world/trip/texts';

type Props = {
  ok: boolean; def: TripDef; day: string;
  rows: [string, string, string?][];
  onBack: () => void;
};

const code = (t: string) => t.replace('use S1', '<code>use S1</code>');

export function TripDone({ ok, def, day, rows, onBack }: Props) {
  const [sent, setSent] = useState(false);
  const vars = { dzień: day };
  const stages = TRIP_TEXT.progress(def, day, ok);
  return (
    <>
      <div className={`card done-card${ok ? '' : ' bad'}`}>
        <b className={ok ? 'acc-t' : 'red-t'}>{ok ? TRIP_TEXT.doneTitle.ok : TRIP_TEXT.doneTitle.fled}</b>
        <div className="sum">
          {rows.map(([a, b, tone]) => <span key={a} className="sumrow"><span>{a}</span><span className={tone}>{b}</span></span>)}
        </div>
        <div className="go">
          <button className="btn pri" disabled={sent} onClick={() => { if (sent) return; setSent(true); onBack(); }}>{TRIP_TEXT.backToPc}</button>
        </div>
        <p className="note" dangerouslySetInnerHTML={{ __html: code(ok ? TRIP_TEXT.doneNote.ok : TRIP_TEXT.doneNote.fled) }} />
      </div>
      <div className="card progcard">
        <b>{TRIP_TEXT.progressTitle}</b> <span className="dim-t">· {def.progressSub}</span>
        <div className="stages">
          {def.progress.map((p, i) => {
            const st = stages[i].state;
            return (
              <div key={i} className={`pst ${st}`}>
                <span>{st === 'done' ? '✓' : st === 'fail' ? '✗' : st === 'next' ? '▶' : `${i + 1}.`}</span>
                <span><b>{fill(p.title, vars)}</b>{st === 'next' ? <span className="nx"> · następny krok</span> : null}<br />
                  <span className="psub">{fill(p.sub, vars)}</span></span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
