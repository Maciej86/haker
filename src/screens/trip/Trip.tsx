// Ekran wyjazdu w teren (wyjazd.tpl.html). Przebieg żyje w stanie komponentu; do GameState nic nie trafia
// przed `finishTrip` (store.apply nie zapisuje przy screen === 'trip').
import { useEffect, useMemo, useRef, useState } from 'react';
import { dur } from '../../engine/clock';
import { fmtSkill } from '../../engine/text';
import { missionDef } from '../../engine/missions';
import {
  TRANSPORTS, WALK, backLeg, cancelTrip, finishTrip, hasPackage, initTalk, planFor, siteSteps, talkAnswer, talkGain,
  talkOptions, talkQuestion, talkReaction, transportOptions, tripOutcome,
  type Leg, type LegId, type SiteStepId, type TalkKind, type TalkState, type TransportId,
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
import { Site, type SiteView } from './Site';
import { Talk, type TalkView } from './Talk';
import { TripDone } from './TripDone';
import { useDragTo } from './useDragTo';
import { LEG_MS, ease, hm } from './timing';
import './trip.css';

type Phase = 'plan' | 'travel' | 'site' | 'back' | 'done';
type Data = { geo: Geo; routes: TripRoutes; nt: Scene; pz: Scene };
type MapView = { kind: RouteKind; pts: [number, number][] };
type Head = { mode: string; name: string; eta: string };

const DESK = ['Terminal', 'Poczta', 'Przeglądarka', 'Darknet', 'Mapa', 'Telefon'];
const REV = (p: [number, number][]) => p.slice().reverse() as [number, number][];
const RAIL_BACK = REV(RAILPTS), CAR_BACK = REV(CARPTS);
type Done = { ok: boolean; end: number; gain: ReturnType<typeof talkGain> };

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
  const [site, setSite] = useState<SiteView | null>(null);
  const [talkView, setTalkView] = useState<TalkView | null>(null);
  const [talk, setTalk] = useState<TalkState>(initTalk);
  const [dev, setDev] = useState<{ text: string; on: boolean } | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const drag = useDragTo();
  const btnRef = useRef<(() => void) | null>(null);
  const pickRef = useRef<((o: [TalkKind, string]) => void) | null>(null);
  const nextRef = useRef<(() => void) | null>(null);
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
    const r = await onSite(at);
    await goBack(r.end, r.talk, r.at);
  };

  // ---------- na miejscu (337–357) ----------
  const patch = (p: Partial<SiteView>) => setSite((v) => (v ? { ...v, ...p } : v));
  const mark = (id: SiteStepId, st: 'now' | 'done') => setSite((v) => (v ? { ...v, state: { ...v.state, [id]: st } } : v));
  const button = (label: string) => new Promise<void>((res) => {
    btnRef.current = () => { btnRef.current = null; patch({ btn: null }); res(); };
    patch({ btn: label });
  });
  const wait = (ms: number) => new Promise<void>((res) => setTimeout(res, ms / speedRef.current));

  const onSite = async (start: number) => {
    const siteLeg = plan.legs.find((l) => l.id === 'site')!;
    const steps = siteSteps(withPackage);
    const ms = (id: SiteStepId) => steps.find((x) => x.id === id)!;
    let tr = start, n = 0;
    setSite({
      steps, state: {}, run: null, btn: null, alarm: false, phone: false, bagHidden: false,
      bag: withPackage ? ['key', 'dev', 'phone'] : ['phone'], cab: { open: false, inside: false, dev: false, led: false },
    });
    setHead({ mode: 'NA MIEJSCU', name: siteLeg.name, eta: '' });
    const progress = async (id: SiteStepId) => {
      const st = ms(id);
      patch({ run: { id, ms: st.ms / speedRef.current, n: ++n } });
      await play({ ...siteLeg, t0: tr, t1: tr + st.minutes }, null, st.ms);
      tr += st.minutes;
      mark(id, 'done');
    };
    const cabTarget = (cls: string) => () => document.querySelector(`.cabinet .${cls}`);
    const H = TRIP_TEXT.stepHints;
    if (!withPackage) {
      mark('package', 'now');
      await button(H.packageBtn);
      say(tr, H.package);
      await progress('package');
      patch({ bag: ['key', 'dev', 'phone'] });
      setDev({ text: 'w plecaku', on: false });
      say(tr, H.packageDone, 'acc');
    }
    mark('look', 'now');
    await button(H.lookBtn);
    say(tr, H.look);
    await progress('look');
    mark('open', 'now');
    await drag.arm('key', cabTarget('door-lock'), H.openDrag);
    say(tr, H.open);
    setSite((v) => (v ? { ...v, cab: { ...v.cab, open: true } } : v));
    setTimeout(() => setSite((v) => (v ? { ...v, cab: { ...v.cab, inside: true } } : v)), 300);
    await progress('open');
    // --- przechodzień (378–405) ---
    const enc = await encounter(tr);
    tr = enc.at;
    if (enc.talk.end !== 'ok') {
      say(tr, H.fled1, 'red');
      say(tr, H.fled2, 'red');
      await wait(500);
      return { end: 'fled' as const, talk: enc.talk, at: tr };
    }
    mark('plug', 'now');
    await drag.arm('dev', cabTarget('slot'), H.plugDrag);
    setSite((v) => (v ? { ...v, cab: { ...v.cab, dev: true } } : v));
    say(tr, H.plug);
    await progress('plug');
    mark('test', 'now');
    await drag.arm('phone', cabTarget('dev-rect'), H.testDrag);
    say(tr, H.testStart, 'dim');
    await progress('test');
    setSite((v) => (v ? { ...v, phone: true, bagHidden: true, cab: { ...v.cab, led: true } } : v));
    say(tr, H.test, 'acc');
    setDev({ text: 'online · S1 · 60 min', on: true });
    mark('close', 'now');
    await button(H.closeBtn);
    setSite((v) => (v ? { ...v, cab: { ...v.cab, open: false, inside: false } } : v));
    say(tr, H.close);
    await progress('close');
    await button(H.leaveBtn);
    return { end: 'ok' as const, talk: enc.talk, at: tr };
  };

  const encounter = async (start: number) => {
    let tr = start, tk = initTalk();
    patch({ alarm: true });
    say(tr, TRIP_TEXT.approach, 'red');
    for (;;) {
      const q = talkQuestion(tk, tr);
      say(tr, `— ${q}`, tk.round === 0 ? 'red' : '');
      setTalkView({ q, first: tk.round === 0, good: tk.good, mid: tk.mid, opts: talkOptions(s.seed, tk), ans: null });
      const pick = await new Promise<[TalkKind, string]>((res) => { pickRef.current = res; });
      const next = talkAnswer(tk, pick[0]);
      const react = talkReaction(tk, pick[0], next);
      tr += 1;
      setNow(tr);
      say(tr, TRIP_TEXT.youSaid(pick[1]));
      if (react) say(tr, `— ${react}`, next.end === 'fled' ? 'red' : '');
      const g = next.end ? talkGain(next) : null;
      if (g) say(tr, TRIP_TEXT.talkGainLine(g.v, g.why), 'acc');
      setTalkView((v) => v && { ...v, good: next.good, mid: next.mid, ans: { you: pick[1], react, end: next.end, badge: g ? TRIP_TEXT.talkGainBadge(g.v, g.badge) : null } });
      tk = next;
      setTalk(next);
      await new Promise<void>((res) => { nextRef.current = res; });
      if (tk.end) {
        setTalkView(null);
        patch({ alarm: false });
        return { talk: tk, at: tr };
      }
    }
  };

  // ---------- powrót (297–305) ----------
  const goBack = async (end: 'ok' | 'fled', tk: TalkState, siteEnd: number) => {
    if (!alive.current) return;
    const B = backLeg(choice, siteEnd);
    setLegs(plan.legs.map((l) => (l.id === 'site' ? { ...l, t1: siteEnd } : l.id === 'back' ? B : l)));
    setPhase('back');
    setCurrent('back');
    say(siteEnd, end === 'fled' ? TRIP_TEXT.fledRun : TRIP_TEXT.walkBack, end === 'fled' ? 'red' : '');
    if (t.kind === 'train') {
      const at = siteEnd + WALK.stationS1;
      say(at, TRIP_TEXT.backTrain(t, B.dep!, B.wait!), 'dim');
      pay(t.cost);
      say(at, TRIP_TEXT.backTicket(t.cost), 'dim');
    } else {
      pay(t.cost);
      say(siteEnd, TRIP_TEXT.backCar(t.cost), 'dim');
    }
    await play(B, { kind: 'pl', pts: t.kind === 'car' ? CAR_BACK : RAIL_BACK }, LEG_MS.back);
    if (!alive.current) return;
    const o = tripOutcome(store.get(), { transport: choice, talk: tk });
    if (o.end !== B.t1) console.error(`Wyjazd: koniec ${B.t1} ≠ tripOutcome ${o.end}`);
    say(B.t1, TRIP_TEXT.home(routes), 'acc');
    setHead({ mode: 'KONIEC', name: end === 'ok' ? TRIP_TEXT.doneTitle.ok : TRIP_TEXT.doneTitle.fled, eta: '' });
    setDone({ ok: end === 'ok', end: B.t1, gain: talkGain(tk) });
    setPhase('done');
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
  const devState = dev ?? { text: withPackage ? 'w plecaku' : 'paczka na przystanku', on: false };
  const doneRows = done ? TRIP_TEXT.doneRows(done.ok, {
    start: `${s.day} ${hm(s.t)}`, end: `${s.day} ${hm(done.end)}`, took: dur(done.end - s.t), spent,
    soc: done.gain?.v ?? 0, socWhy: done.gain?.why ?? '',
    left: done.end < def.deadline ? dur(def.deadline - done.end) : 'po terminie', leftOk: done.end < def.deadline,
  }) : [];

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
                {done ? (
                  <TripDone ok={done.ok} def={def} day={s.day} rows={doneRows}
                    onBack={() => store.apply(finishTrip(store.get(), { transport: choice, talk }))} />
                ) : null}
              </div>
            )}
          </div>
          <div className="right">
            <div className="rh"><span className="mode">{h.mode}</span><span className="leg" data-name={h.name} /><span className="eta">{h.eta}</span></div>
            <RouteMap kind={mapView.kind} pts={mapView.pts} progress={phase === 'plan' ? 0 : progress}
              geo={data.geo} nt={data.nt} pz={data.pz} mode={t.kind} />
            {phase === 'site' && site ? (
              <Site v={site} def={def} street={routes.s1Street} drag={drag} onBtn={() => btnRef.current?.()}
                talk={talkView ? <Talk v={talkView} social={fmtSkill(s.skills.Social)}
                  onPick={(o) => pickRef.current?.(o)} onNext={() => nextRef.current?.()} /> : null} />
            ) : null}
            {phase === 'travel' || phase === 'back' ? <button className="btn skip" onClick={toggleSpeed}>{speed === 1 ? TRIP_TEXT.skipFast : TRIP_TEXT.skipNormal}</button> : null}
            <div className="tl">
              <Timeline legs={shownLegs} start={s.t} end={shownLegs[shownLegs.length - 1].t1} deadline={def.deadline}
                now={phase === 'plan' ? s.t : now} current={phase === 'plan' ? null : current} />
            </div>
          </div>
        </div>
        <StatusBar day={s.day} now={phase === 'plan' ? s.t : now} money={s.money - spent} dev={devState.text} devOn={devState.on} deadline={def.deadline} />
      </div>
    </div>
  );
}
