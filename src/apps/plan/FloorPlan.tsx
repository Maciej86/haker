import { useMemo } from 'react';
import { floorPlanView, type PlanDot, type PlanView } from '../../engine/missions';
import { useGame } from '../../ui/useGame';
import './plan.css';

/** Plan piętra z silnika: SVG (dane gry) i wiersze stanu (misja.html linie 493–496, 1759–1767). */
export function FloorPlanView({ view }: { view: PlanView }) {
  return (
    <div className="plan-body">
      <svg id="plan7" viewBox="0 0 600 290" dangerouslySetInnerHTML={{ __html: view.svg }} />
      <div id="plan-st">
        {view.rows.map((r) => (
          <div className="row2" key={r.label}>
            <span>{r.label}</span>
            <span className={r.coin ? 'plan-coin' : undefined}>{r.value}</span>
          </div>
        ))}
        <p dangerouslySetInnerHTML={{ __html: view.footer }} />
      </div>
    </div>
  );
}

/** Okno „Plan piętra”; `dot` podaje pokaz przejścia (plan 31). */
export function FloorPlanApp({ dot }: { dot?: PlanDot | null }) {
  const s = useGame((x) => x); // widok liczony z całego stanu: selektor nie może zwracać nowego obiektu
  const view = useMemo(() => floorPlanView(s, dot ?? null), [s, dot]);
  if (!view) return <div className="plan-empty">Plan piętra pojawi się w zleceniu.</div>;
  return <FloorPlanView view={view} />;
}
