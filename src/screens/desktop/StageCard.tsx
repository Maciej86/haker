import { stageView } from '../../engine/missions';
import { Card } from '../../ui/Card';
import { useGame } from '../../ui/useGame';
import { usePref } from '../../ui/prefs';

// misja.html linie 464 i 725–735
export function StageCard() {
  const s = useGame((x) => x);
  const [coach] = usePref('neonos-coach', 'on');
  const rows = stageView(s);
  return (
    <Card title="Postęp zlecenia">
      <div id="stages">
        {rows.length === 0 ? <small>Przyjmij zlecenie w Poczcie.</small> : rows.map((r, i) => (
          <div key={i} className={r.state === 'todo' ? 'stage' : `stage ${r.state}`}>
            <i>{r.mark}</i>
            <span>
              <b>{r.title}</b>
              <small>{r.sub}</small>
              {r.coach && coach !== 'off'
                ? <span className="coach" dangerouslySetInnerHTML={{ __html: `co teraz: ${r.coach}` }} />
                : null}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
