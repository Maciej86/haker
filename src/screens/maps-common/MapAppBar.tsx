import { gclk } from '../../engine/clock';
import { toDesktop } from '../../engine/maps';
import { missionDef } from '../../engine/missions';
import { useGame, useStore } from '../../ui/useGame';
import './MapAppBar.css';

/** Pasek aplikacji Mapa (mapa-miasta.html, #appbar). */
export function MapAppBar() {
  const store = useStore();
  const s = useGame((x) => x);
  const trip = missionDef(s.active)?.trip;
  return (
    <div className="map-appbar">
      <span className="lg">▣ NeonOS · Mapa</span>
      <span className="ms">{trip ? `zlecenie: ${trip.mapLabel}` : 'brak przyjętego zlecenia'}</span>
      <span className="ck">{gclk(s)} · oglądanie mapy nie zużywa czasu</span>
      <button onClick={() => store.apply(toDesktop(store.get()))}>✕ wróć na pulpit</button>
    </div>
  );
}

/** Karta po najechaniu (#info): rodzaj, tytuł, wiersze, stopka. */
export type InfoCard = {
  kind: string; title: string;
  rows: [string, string, string?][];
  foot?: { text: string; tone: 'acc' | 'dim' | 'coin' } | null;
  empty?: string;
};

export function InfoBox({ card, className }: { card: InfoCard; className: string }) {
  return (
    <div className={`info ${className}`}>
      <span className="k">{card.kind}</span>
      <h4>{card.title}</h4>
      <ul>
        {card.rows.length
          ? card.rows.map((r, i) => <li key={i} className={r[2] ?? ''}><span>{r[0]}</span>{r[1]}</li>)
          : card.empty ? <li>{card.empty}</li> : null}
      </ul>
      {card.foot ? <div className={card.foot.tone === 'coin' ? 'lock' : card.foot.tone === 'dim' ? 'foot dim' : 'foot'}>{card.foot.text}</div> : null}
    </div>
  );
}
