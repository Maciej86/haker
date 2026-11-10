// Plan wyjazdu (wyjazd.tpl.html 260–270): cel, środki transportu, plecak, podsumowanie, „Jedź” / „Anuluj”.
import { TRANSPORTS, type TransportId, type TripDef, type TripPlan } from '../../engine/trip';
import type { TripRoutes } from '../../world/city/types';
import { TRIP_TEXT } from '../../world/trip/texts';

type Opt = { id: TransportId; plan: TripPlan; affordable: boolean };
type Props = {
  def: TripDef; routes: TripRoutes; day: string; start: number; withPackage: boolean;
  options: Opt[]; choice: TransportId; onChoose: (id: TransportId) => void;
  onGo: () => void; onCancel: () => void;
};

export function TripPlanView({ def, routes, day, start, withPackage, options, choice, onChoose, onGo, onCancel }: Props) {
  const cur = options.find((o) => o.id === choice)!;
  const rows = TRIP_TEXT.summaryRows(day, start, cur.plan.arrive, cur.plan.end, cur.plan.cost, def.deadline);
  return (
    <div className="plan">
      <h3>Cel</h3>
      <div className="card tgt" dangerouslySetInnerHTML={{ __html: TRIP_TEXT.targetCard(routes, def, !withPackage) }} />
      <h3>Dojazd do Poznania</h3>
      {options.map(({ id, plan, affordable }) => {
        const t = TRANSPORTS[id];
        return (
          <div key={id} data-k={id} aria-disabled={!affordable}
            className={['opt', id === choice ? 'on' : '', affordable ? '' : 'off'].filter(Boolean).join(' ')}
            onClick={affordable ? () => onChoose(id) : undefined}>
            <span className="r" />
            <span><span className="n">{t.name}</span> <span className="dim-t">· {t.sub}</span></span>
            <span className="c">{plan.cost} ¤{affordable ? null : <small className="poor"> · {TRIP_TEXT.tooPoor}</small>}</span>
            <span className="d" dangerouslySetInnerHTML={{ __html: TRIP_TEXT.optionDesc(t, plan) }} />
          </div>
        );
      })}
      <h3>W plecaku</h3>
      <div className="card">
        {TRIP_TEXT.bag(def, withPackage).map((k) => (
          <div key={k.name} className="kit"><span>{k.name}</span><span className={k.tone === 'coin' ? 'coin-t' : 'dim-t'}>{k.state}</span></div>
        ))}
      </div>
      <h3>Podsumowanie</h3>
      <div className="card sum">
        {rows.map(([a, b, tone]) => <span key={a} className="sumrow"><span>{a}</span><span className={tone}>{b}</span></span>)}
      </div>
      <div className="go">
        <button className="btn pri" disabled={!cur.affordable} onClick={onGo}>{TRIP_TEXT.goBtn}</button>
        <button className="btn" title={TRIP_TEXT.cancelTitle} onClick={onCancel}>{TRIP_TEXT.cancelBtn}</button>
      </div>
      <p className="note">{TRIP_TEXT.planNote}</p>
    </div>
  );
}
