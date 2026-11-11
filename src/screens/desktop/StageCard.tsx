import { stageView } from '../../engine/missions';
import { bugAtS1Minutes, bugTripOffer, tripAgain, TRIP_AGAIN } from '../../engine/devices';
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
  const drive = dur(TRIP_AGAIN.minutes).replace(/ /g, '\u00a0'); // „1 h 50 min” bez łamania
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
        <Button className="wide" style={{ marginTop: 8 }} onClick={() => store.apply(tripAgain(store.get()))}>
          {(bugAtS1Minutes(s) ?? 0) > 0
            ? `Jedź i podmień (stary: ${bugAtS1Minutes(s)} min) · samochód ok. ${drive}, ${TRIP_AGAIN.cost}\u00a0¤`
            : `Jedź i podepnij · samochód ok. ${drive}, ${TRIP_AGAIN.cost}\u00a0¤`}
        </Button>
      ) : null}
    </Card>
  );
}
