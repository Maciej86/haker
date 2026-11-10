// Na miejscu przy skrzynce S1 (wyjazd.tpl.html 337–357): kroki, przycisk albo podpowiedź przeciągania,
// szafka, plecak, telefon z Łącznikiem i rozmowa z przechodniem.
import type { ReactNode } from 'react';
import type { SiteStep, SiteStepId, TripDef } from '../../engine/trip';
import { TRIP_TEXT } from '../../world/trip/texts';
import { Cabinet, type CabState } from './Cabinet';
import type { DragTo, ItemKey } from './useDragTo';

export type SiteView = {
  steps: SiteStep[];
  state: Partial<Record<SiteStepId, 'now' | 'done'>>;
  run: { id: SiteStepId; ms: number; n: number } | null; // pasek postępu bieżącego kroku
  btn: string | null;
  bag: ItemKey[];          // widoczne przedmioty
  bagHidden: boolean;      // po teście łącza plecak znika, pojawia się telefon
  phone: boolean;
  alarm: boolean;
  cab: CabState;
};

type Props = { v: SiteView; def: TripDef; street: string; drag: DragTo; onBtn: () => void; talk: ReactNode };

export function Site({ v, def, street, drag, onBtn, talk }: Props) {
  const items = TRIP_TEXT.bagItems(def);
  const ghost = drag.ghost ? items.find((x) => x.k === drag.ghost!.item) : null;
  return (
    <div className={v.alarm ? 'site alarm' : 'site'}>
      <div className="sitecol">
      <div className="steps">
        {v.steps.map((s) => {
          const st = v.state[s.id];
          return (
            <div key={s.id} className={['step', st].filter(Boolean).join(' ')}>
              <span className="ic" />
              <span><b>{s.title}</b><br /><span className="ssub">{s.sub}</span></span>
              <span className="pb">{v.run && v.run.id === s.id
                ? <i key={v.run.n} style={{ animation: `trip-pb ${v.run.ms}ms linear forwards` }} /> : <i />}</span>
            </div>
          );
        })}
      </div>
      <div className="act">
        {v.btn ? <button className="btn pri" onClick={onBtn}>{v.btn}</button> : null}
        {drag.armed ? <div key={drag.shake} className={drag.shake ? 'drag-hint shake' : 'drag-hint'} dangerouslySetInnerHTML={{ __html: drag.armed.hint }} /> : null}
      </div>
      <div className="spacer" />
      {v.phone ? (
        <div className="phone">
          <div className="ph-top">{TRIP_TEXT.phone.top}</div>
          {TRIP_TEXT.phone.rows.map((r, i) => (
            <div key={i} className={`ph-row${i === 0 || i === 3 ? ' ok' : i === 5 ? ' dim' : ''}`}
              dangerouslySetInnerHTML={{ __html: r.replace('use S1', '<code>use S1</code>') }} />
          ))}
        </div>
      ) : null}
      {v.bagHidden ? null : (
        <div className="bag">
          <div className="lh">Plecak</div>
          <div className="items">
            {items.filter((x) => v.bag.includes(x.k as ItemKey)).map((x) => {
              const k = x.k as ItemKey;
              const cls = ['it', drag.armed?.item === k ? 'ready' : '', drag.lift === k ? 'lift' : '', drag.used.includes(k) ? 'used' : ''];
              return (
                <div key={k} data-k={k} className={cls.filter(Boolean).join(' ')} onPointerDown={drag.onPointerDown(k)}>
                  <span className="g">{x.g}</span><span><b>{x.name}</b><br /><small>{x.sub}</small></span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>
      <Cabinet street={street} st={v.cab} />
      {talk}
      {ghost && drag.ghost ? (
        <div className="it ghost" style={{ left: drag.ghost.x, top: drag.ghost.y }}>
          <span className="g">{ghost.g}</span><span><b>{ghost.name}</b><br /><small>{ghost.sub}</small></span>
        </div>
      ) : null}
    </div>
  );
}
