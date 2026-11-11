import { stageView } from '../../engine/missions';
import { bugTripOffer, tripAgain, TRIP_AGAIN } from '../../engine/devices';
import { dur } from '../../engine/clock';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { useGame, useStore } from '../../ui/useGame';
import { usePref } from '../../ui/prefs';

// misja.html linie 464 i 725–735
export function StageCard() {
  const s = useGame((x) => x);
  const store = useStore();
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
      {bugTripOffer(s) ? (
        // [decyzja] misja.html linia 1418 miała ten przycisk w Terminalu; linie Terminala nie mają akcji.
        <Button style={{ marginTop: 8 }} onClick={() => store.apply(tripAgain(store.get()))}>
          {`Jedź i podepnij · samochód ok. ${dur(TRIP_AGAIN.minutes)}, ${TRIP_AGAIN.cost} ¤`}
        </Button>
      ) : null}
    </Card>
  );
}
