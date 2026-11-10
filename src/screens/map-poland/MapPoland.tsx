// Ekran mapy Polski (mapa-polski.tpl.html, tryb app=1).
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { hhmm } from '../../engine/clock';
import { openCity } from '../../engine/maps';
import { missionDef } from '../../engine/missions';
import { AIRPORTS, CITIES, CITY_TAB, airportCard, cityCardRows } from '../../world/geo/cities';
import { loadGeo, type Geo } from '../../world/geo/load';
import { drawPoland } from '../../world/geo/render';
import { useGame, useStore } from '../../ui/useGame';
import { usePanZoom } from '../../ui/usePanZoom';
import { InfoBox, MapAppBar, type InfoCard } from '../maps-common/MapAppBar';
import './MapPoland.css';

const BB = { x: 60, y: 20, w: 780, h: 720 };
type Layer = 'noroads' | 'noair' | 'novoi';
const LAYERS: [Layer, string][] = [['noroads', 'drogi'], ['noair', 'lotniska'], ['novoi', 'województwa']];

export default function MapPoland() {
  const store = useStore();
  const s = useGame((x) => x);
  const trip = missionDef(s.active)?.trip ?? null;
  const [geo, setGeo] = useState<Geo | null>(null);
  const [off, setOff] = useState<Layer[]>([]);
  const [card, setCard] = useState<InfoCard | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const hovRef = useRef<Element | null>(null);

  useEffect(() => {
    let alive = true;
    loadGeo().then((g) => { if (alive) setGeo(g); });
    return () => { alive = false; };
  }, []);

  const fit = () => {
    const r = svgRef.current?.getBoundingClientRect();
    return r && r.width ? Math.min(r.width / BB.w, r.height / BB.h) : 1;
  };
  const pz = usePanZoom(svgRef, {
    full: () => BB,
    clamp: 'center',
    zmin: () => fit() * 0.8,
    zmax: () => fit() * 8,
    home: () => ({ zoom: fit() * 1.05, cx: BB.x + BB.w / 2 - 60, cy: BB.y + BB.h / 2 }),
    onApply: (v) => {
      const svg = svgRef.current!, ft = fit();
      svg.classList.toggle('far', v.zoom < 2.2 * ft);
      svg.style.setProperty('--k', String(Math.max(0.35, Math.min(1.6, ft * 1.05 / v.zoom * Math.pow(v.zoom / ft / 1.05, 0.25)))));
    },
  });

  const html = useMemo(() => (geo ? drawPoland(geo, { missionCity: trip?.city ?? null }) : ''), [geo, trip?.city]);
  useLayoutEffect(() => { if (html) pz.home(); }, [html, pz]);

  const pick = (e: { target: EventTarget | null; clientX: number; clientY: number }): Element | null =>
    (e.target as Element | null)?.closest?.('.city')
    ?? (typeof document.elementFromPoint === 'function' ? document.elementFromPoint(e.clientX, e.clientY)?.closest('.city') : null)
    ?? null;

  const hover = (el: Element | null) => {
    if (el === hovRef.current) return;
    hovRef.current?.classList.remove('hov');
    hovRef.current = el;
    if (!el) { setCard(null); return; }
    el.classList.add('hov');
    const a = el.getAttribute('data-a');
    setCard(a != null ? airportCard(AIRPORTS[+a]) : cityCardRows(CITIES[+el.getAttribute('data-i')!], trip, s.day));
  };

  const onMove = (e: React.PointerEvent) => { if (!pz.dragging()) hover(pick(e)); };
  const onUp = (e: React.PointerEvent) => {
    if (pz.moved()) return;
    const el = pick(e);
    if (!el || el.getAttribute('data-a') != null) return; // lotniska niedostępne w demo
    const tab = CITY_TAB[CITIES[+el.getAttribute('data-i')!].n];
    if (tab) store.apply(openCity(store.get(), tab));
  };
  const zoomBtn = (f: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    pz.zoomAt(f, r.width / 2, r.height / 2);
  };

  return (
    <div data-screen="mapPoland" className="mapscr mp">
      <MapAppBar />
      <div className="tabs">
        <button className="on">Polska</button>
        <button disabled title="Odblokowuje się później w fabule">Europa <small>· później</small></button>
        <button disabled title="Odblokowuje się później w fabule">Świat <small>· później</small></button>
      </div>
      <div className={['map-stage', ...off].join(' ')}>
        <svg ref={svgRef} className="map geo" onPointerMove={onMove} onPointerUp={onUp}
          onPointerLeave={() => hover(null)} dangerouslySetInnerHTML={{ __html: html }} />
        {geo ? null : <div className="loading">wczytuję mapę…</div>}
        <div className="hud">
          <button onClick={() => zoomBtn(1.25)}>+</button>
          <button onClick={() => zoomBtn(0.8)}>−</button>
          <button onClick={() => pz.home()}>⌂ start</button>
          {LAYERS.map(([c, label]) => (
            <button key={c} className={off.includes(c) ? '' : 'on'}
              onClick={() => setOff((o) => (o.includes(c) ? o.filter((x) => x !== c) : [...o, c]))}>{label}</button>
          ))}
        </div>
        <div className="side">
          <b>Polska</b> <span className="dim">· start w małych miejscowościach</span>
          {trip ? (
            <div className="mis">◎ <b>Zlecenie:</b> {trip.mapText}<br />
              <span className="dim">termin {s.day} {hhmm(trip.deadline)} · dojazd z domu: ekspres 30 min, regionalny 46 min</span>
            </div>
          ) : null}
          <div className="lg">
            <svg width="14" height="14"><circle cx="7" cy="7" r="4" style={{ fill: 'var(--acc)' }} /></svg><span>dom: Nowy Tomyśl</span>
            <svg width="14" height="14"><circle cx="7" cy="7" r="4" style={{ fill: 'var(--text)' }} /></svg><span>dostępne miasto</span>
            <svg width="14" height="14"><circle cx="7" cy="7" r="4" style={{ fill: 'var(--geo-land)', stroke: 'var(--dim)' }} /></svg><span>zablokowane 🔒</span>
            <svg width="14" height="14"><rect x="2" y="2" width="10" height="10" style={{ fill: 'none', stroke: 'var(--text)' }} /></svg><span>duże miasto (z dzielnicami)</span>
            <svg width="14" height="14"><path d="M0 7h14" strokeWidth="2" style={{ stroke: 'var(--geo-road-a)' }} /></svg><span>autostrada</span>
            <svg width="14" height="14"><path d="M0 7h14" strokeDasharray="4 2" style={{ stroke: 'var(--geo-road-s)' }} /></svg><span>droga ekspresowa</span>
            <svg width="14" height="14"><text x="2" y="11" fontSize="11" style={{ fill: 'var(--blue)' }}>✈</text></svg><span>lotnisko</span>
          </div>
        </div>
        {card ? <InfoBox card={card} className="pl-info" /> : null}
        <div className="hint">przeciągnij = przesuń · kółko = przybliż (małe miejscowości pojawiają się po przybliżeniu) · kliknij miasto = wejdź</div>
      </div>
    </div>
  );
}
