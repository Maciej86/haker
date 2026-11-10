// Ekran wyjazdu w teren (wyjazd.tpl.html). Przebieg żyje w stanie komponentu; do GameState nic nie trafia
// przed `finishTrip` (store.apply nie zapisuje przy screen === 'trip').
import { useEffect, useMemo, useRef, useState } from 'react';
import { dur } from '../../engine/clock';
import { missionDef } from '../../engine/missions';
import {
  TRANSPORTS, cancelTrip, hasPackage, planFor, transportOptions,
  type Leg, type LegId, type TransportId,
} from '../../engine/trip';
import { loadScene, loadTripRoutes } from '../../world/city/load';
import type { Scene, TripRoutes } from '../../world/city/types';
import { loadGeo, type Geo } from '../../world/geo/load';
import { CARPTS, RAILPTS } from '../../world/geo/render';
import { TRIP_TEXT } from '../../world/trip/texts';
import { useGame, useStore } from '../../ui/useGame';
import { RouteMap, type RouteKind } from './RouteMap';
import { StatusBar } from './StatusBar';
import { Timeline } from './Timeline';
import { TripLog, type LogEntry } from './TripLog';
import { TripPlanView } from './TripPlanView';
import { LEG_MS, ease, hm } from './timing';
import './trip.css';

type Phase = 'plan' | 'travel' | 'site' | 'back' | 'done';
type Data = { geo: Geo; routes: TripRoutes; nt: Scene; pz: Scene };
type MapView = { kind: RouteKind; pts: [number, number][] };
type Head = { mode: string; name: string; eta: string };

const DESK = ['Terminal', 'Poczta', 'Przeglądarka', 'Darknet', 'Mapa', 'Telefon'];

export default function Trip() {
  const store = useStore();
  const s = useGame((x) => x);
  const def = missionDef(s.active)?.trip ?? null;
  const options = useMemo(() => transportOptions(s), [s]);
  const withPackage = hasPackage(s);

  const [data, setData] = useState<Data | null>(null);
  const [phase, setPhase] = useState<Phase>('plan');
  const [choice, setChoice] = useState<TransportId>(() => (options.find((o) => o.id === 'regio' && o.affordable) ?? options.find((o) => o.affordable) ?? options[0]).id);
  const [now, setNow] = useState(s.t);
  const [spent, setSpent] = useState(0);
  const [speed, setSpeed] = useState<1 | 4>(1);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [current, setCurrent] = useState<LegId | null>(null);
  const [legs, setLegs] = useState<Leg[] | null>(null);
  const [view, setView] = useState<MapView | null>(null);
  const [progress, setProgress] = useState(0);
  const [head, setHead] = useState<Head | null>(null);
  const speedRef = useRef<number>(1);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    Promise.all([loadGeo(), loadTripRoutes(), loadScene('nt'), loadScene('centrum')])
      .then(([geo, routes, nt, pz]) => { if (alive.current) setData({ geo, routes, nt, pz }); });
    return () => { alive.current = false; };
  }, []);

  const t = TRANSPORTS[choice];
  const plan = useMemo(() => planFor(s.t, choice), [s.t, choice]);
  const shownLegs = legs ?? plan.legs;

  if (!def || !data) {
    return <div data-screen="trip" className="trip"><div className="desk" /><div className="twin"><div className="tb"><span className="t">⛟ WYJAZD W TEREN</span></div></div></div>;
  }
  const { routes } = data;

  const say = (at: number, html: string, cls: LogEntry['cls'] = '') => setLog((l) => [...l, { t: at, html, cls }]);
  const pay = (n: number) => setSpent((x) => x + n);

  /** Odcinek: `now` biegnie od t0 do t1, znacznik na mapie z wygładzeniem; czas ekranu `ms / speed`. */
  const play = (leg: { t0: number; t1: number; name: string; mode: string }, map: MapView | null, ms: number) =>
    new Promise<void>((done) => {
      setHead({ mode: leg.mode, name: leg.name, eta: `${hm(leg.t0)} → ${hm(leg.t1)} · ${dur(leg.t1 - leg.t0)}` });
      if (map) { setView(map); setProgress(0); }
      let k = 0, last = performance.now();
      const frame = (ts: number) => {
        if (!alive.current) return;
        k = Math.min(1, k + Math.max(0, ts - last) * speedRef.current / ms);
        last = ts;
        if (map) setProgress(ease(k));
        setNow(leg.t0 + (leg.t1 - leg.t0) * k);
        if (k < 1) requestAnimationFrame(frame); else done();
      };
      requestAnimationFrame(frame);
    });

  const travel = async () => {
    const L = (id: LegId) => plan.legs.find((l) => l.id === id)!;
    const leg = async (id: LegId, map: MapView | null, ms: number) => { setCurrent(id); await play(L(id), map, ms); return L(id).t1; };
    let at = s.t;
    say(at, TRIP_TEXT.leave(routes));
    if (t.kind === 'train') {
      at = await leg('walk1', { kind: 'nt', pts: routes.rNT }, LEG_MS.train.walk1);
      say(at, TRIP_TEXT.station(t, plan.dep!));
      setCurrent('wait1'); say(at, TRIP_TEXT.ticket(t.cost), 'dim'); pay(t.cost);
      await play(L('wait1'), null, LEG_MS.train.wait1);
      setCurrent('ride1'); say(plan.dep!, TRIP_TEXT.departure(t.id));
      at = await leg('ride1', { kind: 'pl', pts: RAILPTS }, LEG_MS.train.ride1);
      say(at, TRIP_TEXT.arrivalStation(routes));
      at = await leg('walk2', { kind: 'pz', pts: routes.rPZ }, LEG_MS.train.walk2);
    } else {
      at = await leg('walk1', { kind: 'nt', pts: routes.rNTcar }, LEG_MS.car.walk1);
      say(at, TRIP_TEXT.carA2(t.cost), 'dim'); pay(t.cost);
      at = await leg('ride1', { kind: 'pl', pts: CARPTS }, LEG_MS.car.ride1);
      say(at, TRIP_TEXT.carExit(routes));
      at = await leg('drive2', { kind: 'pz', pts: routes.rPZcar }, LEG_MS.car.drive2);
      setCurrent('park'); say(at, TRIP_TEXT.parkSearch(routes));
      at = await leg('park', null, LEG_MS.car.park);
      say(at, TRIP_TEXT.parked(t.park), 'dim'); pay(t.park);
      at = await leg('walk2', { kind: 'pz', pts: routes.rPZwalk }, LEG_MS.car.walk2);
    }
    if (!alive.current) return;
    say(at, TRIP_TEXT.onSite(routes), 'acc');
    setCurrent('site');
    setPhase('site');
    setHead({ mode: 'NA MIEJSCU', name: L('site').name, eta: '' });
  };

  const go = () => {
    if (phase !== 'plan' || !options.find((o) => o.id === choice)?.affordable) return;
    setLegs(plan.legs);
    setPhase('travel');
    void travel();
  };
  const toggleSpeed = () => {
    const n = speedRef.current === 1 ? 4 : 1;
    speedRef.current = n;
    setSpeed(n as 1 | 4);
  };

  const planHead: Head = { mode: 'PLAN', name: TRIP_TEXT.planLegName, eta: `${t.name} · ${t.ride} min · ${plan.cost} ¤` };
  const h = phase === 'plan' ? planHead : head ?? planHead;
  const mapView: MapView = phase === 'plan' || !view ? { kind: 'pl', pts: t.kind === 'car' ? CARPTS : RAILPTS } : view;
  const devText = withPackage ? 'w plecaku' : 'paczka na przystanku';

  return (
    <div data-screen="trip" className="trip">
      <div className="desk">
        {DESK.map((n, i) => <div key={n} className="dic" style={{ top: 30 + i * 80 }}><i />{n}</div>)}
        <div className="deskbar" />
      </div>
      <div className="twin">
        <div className="tb"><span className="t">⛟ WYJAZD W TEREN</span><span className="s">{TRIP_TEXT.planTitle}</span><span className="lock">🔒 komputer zablokowany do powrotu</span></div>
        <div className="tbody">
          <div className="left">
            {phase === 'plan' ? (
              <TripPlanView def={def} routes={routes} day={s.day} start={s.t} withPackage={withPackage}
                options={options} choice={choice} onChoose={setChoice} onGo={go}
                onCancel={() => store.apply(cancelTrip(store.get()))} />
            ) : (
              <div className="logwrap">
                <div className="lh">Dziennik wyjazdu</div>
                <TripLog entries={log} />
              </div>
            )}
          </div>
          <div className="right">
            <div className="rh"><span className="mode">{h.mode}</span><span className="leg" data-name={h.name} /><span className="eta">{h.eta}</span></div>
            <RouteMap kind={mapView.kind} pts={mapView.pts} progress={phase === 'plan' ? 0 : progress}
              geo={data.geo} nt={data.nt} pz={data.pz} mode={t.kind} />
            {phase === 'site' ? <div className="site" /> : null}
            {phase === 'travel' || phase === 'back' ? <button className="btn skip" onClick={toggleSpeed}>{speed === 1 ? TRIP_TEXT.skipFast : TRIP_TEXT.skipNormal}</button> : null}
            <div className="tl">
              <Timeline legs={shownLegs} start={s.t} end={shownLegs[shownLegs.length - 1].t1} deadline={def.deadline}
                now={phase === 'plan' ? s.t : now} current={phase === 'plan' ? null : current} />
            </div>
          </div>
        </div>
        <StatusBar day={s.day} now={phase === 'plan' ? s.t : now} money={s.money - spent} dev={devText} deadline={def.deadline} />
      </div>
    </div>
  );
}
