// Ekran mapy miasta (mapa-miasta.html, tryb app=1): Nowy Tomyśl, Leszno, Poznań i jego dzielnice.
// Mapa nie zdradza celu: `targetIndex` służy tylko do policzenia TripTarget.isTarget dla silnika.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { openCity, openDistrict, toPoland, type CityTab } from '../../engine/maps';
import { planTrip, tripBlock, type TripTarget } from '../../engine/trip';
import { buildingInfo, buildingTitle, districtCard, floorsWord } from '../../world/city/info';
import { loadCity, loadScene } from '../../world/city/load';
import { DISTRICT_META, TIER_META } from '../../world/city/meta';
import { P, drawCity, drawScene } from '../../world/city/render';
import type { CityView, DistrictKey, Scene, SceneKey } from '../../world/city/types';
import { useGame, useStore } from '../../ui/useGame';
import { usePanZoom, type ViewRect } from '../../ui/usePanZoom';
import { InfoBox, MapAppBar, type InfoCard } from '../maps-common/MapAppBar';
import { CityInfoCard } from './CityInfoCard';
import { GoCard } from './GoCard';
import './MapCity.css';

type Data = { key: string; scene: Scene | null; city: CityView | null };
type Hit = { d: DistrictKey } | { air: 1 } | { station: 1 } | { water: 1 } | null;

const TABS: [CityTab, string, string][] = [
  ['nt', TIER_META.nt.label, TIER_META.nt.tag],
  ['leszno', TIER_META.leszno.label, TIER_META.leszno.tag],
  ['poznan', 'Poznań', 'duże miasto · dzielnice'],
];

function hitCard(C: CityView, h: NonNullable<Hit>): InfoCard {
  if ('d' in h) {
    const c = districtCard(C, h.d);
    return {
      kind: `dzielnica · ${c.n} kwartałów`, title: DISTRICT_META[h.d].name,
      rows: [['z Dworca Gł.', c.fromStation, 's'], ...c.rows], foot: { text: '▸ kliknij, żeby wejść do dzielnicy', tone: 'acc' },
    };
  }
  if ('air' in h) {
    return {
      kind: 'obiekt · osobna mapa', title: 'Port Lotniczy Poznań-Warta',
      rows: [['gdzie', 'zachód miasta, obok Ławicy'], ['dojazd', 'ul. Bukowska, autobus 159 z Dworca Głównego']],
      foot: { text: 'niedostępne w demo', tone: 'dim' },
    };
  }
  if ('station' in h) {
    return {
      kind: 'obiekt · osobna mapa (później)', title: 'Dworzec Główny',
      rows: [['gdzie', 'Centrum, przy torach'], ['perony', '6, pociągi do Warszawy, Berlina, Nowego Tomyśla'], ['mapa dworca', 'w przygotowaniu, jak mapa lotniska']],
    };
  }
  return { kind: 'rzeka', title: 'Warta', rows: [['mosty', 'na głównych ulicach i kolejowy']] };
}

export default function MapCity() {
  const store = useStore();
  const tab = useGame((s) => s.mapCityTab);
  const dist = useGame((s) => (s.mapCityTab === 'poznan' ? s.mapCityDistrict as DistrictKey | null : null));
  const mode: 'city' | 'map' = tab === 'poznan' && !dist ? 'city' : 'map';
  const key: SceneKey | 'poznan' = tab === 'poznan' ? dist ?? 'poznan' : tab;

  const [data, setData] = useState<Data | null>(null);
  const [card, setCard] = useState<InfoCard | null>(null);
  const [go, setGo] = useState<{ i: number; msg: string | null } | null>(null);
  const [xray, setXray] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const miniRef = useRef<SVGSVGElement>(null);
  const full = useRef<ViewRect>({ x: 0, y: 0, w: 1, h: 1 });
  const hov = useRef<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    let alive = true;
    setCard(null); setGo(null); hov.current = null;
    const p = key === 'poznan'
      ? loadCity().then((city) => ({ key, scene: null, city }))
      : loadScene(key).then((scene) => ({ key, scene, city: null }));
    p.then((d) => { if (alive) setData(d); });
    return () => { alive = false; };
  }, [key]);

  const ready = data && data.key === key ? data : null;
  const S = ready?.scene ?? null, C = ready?.city ?? null;
  const drawn = useMemo(() => {
    if (C) return { m: drawCity(C), mm: drawCity(C, { mini: true }) };
    if (S) return { m: drawScene(S), mm: drawScene(S, { mini: true }) };
    return null;
  }, [S, C]);
  if (drawn) {
    const bb = drawn.m.bb, pad = 30;
    full.current = { x: bb[0] - pad, y: bb[1] - pad, w: bb[2] - bb[0] + 2 * pad, h: bb[3] - bb[1] + 2 * pad };
  }

  const pz = usePanZoom(svgRef, {
    full: () => full.current,
    zmin: () => (C ? 0.1 : 0.4),
    zmax: 4,
    home: () => {
      const F = full.current;
      if (C || !S) {
        const r = svgRef.current!.getBoundingClientRect();
        return { zoom: Math.min(r.width / F.w, r.height / F.h) * 1.08, cx: F.x + F.w / 2, cy: F.y + F.h / 2 };
      }
      const p = P(S.start.x, S.start.y);
      return { cx: p[0] + (S.home ? 40 : 300), cy: p[1] - (S.home ? 20 : 40), zoom: S.tier === 'small' ? 1.5 : 1.6 };
    },
    onApply: (_v, vb) => {
      const mv = miniRef.current?.querySelector('.mv');
      if (!mv) return;
      mv.setAttribute('x', String(vb.x)); mv.setAttribute('y', String(vb.y));
      mv.setAttribute('width', String(vb.w)); mv.setAttribute('height', String(vb.h));
    },
  });
  useLayoutEffect(() => { if (drawn) pz.home(); }, [drawn, pz]);

  const html = drawn?.m.g ?? '';
  const F = full.current;
  // Minimapa bez klas dzielnic: hover i klik dotyczą tylko głównej mapy.
  const mini = drawn ? drawn.mm.g.replace(/ class="dist" data-d="[a-z]+"/g, '') + `<rect class="mv" style="fill:var(--acc-bg);stroke:var(--acc)" stroke-width="${C ? 24 : 8}"/>` : '';

  // punkt ekranu → współrzędne planu (z = 0), jak toPlan/cityHit w makiecie (579–582)
  const cityHit = (e: { clientX: number; clientY: number; target: EventTarget | null }): Hit => {
    const svg = svgRef.current;
    const ctm = svg && typeof svg.getScreenCTM === 'function' ? svg.getScreenCTM() : null;
    if (!C) return null;
    if (!ctm) {
      const d = (e.target as Element | null)?.closest?.('.dist')?.getAttribute('data-d');
      return d ? { d: d as DistrictKey } : null;
    }
    const pt = svg!.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const q = pt.matrixTransform(ctm.inverse());
    const p = { x: q.y + q.x / 1.732, y: q.y - q.x / 1.732 };
    const A = C.AIR;
    if (p.x > A.x && p.x < A.x + A.w && p.y > A.y && p.y < A.y + A.h) return { air: 1 };
    const D = C.dworzec;
    if (p.x > D.x - 20 && p.x < D.x + D.w + 20 && p.y > D.y - 20 && p.y < D.y + D.d + 20) return { station: 1 };
    const i = C.V.findIndex((s) => s.c > p.x), j = C.Hs.findIndex((s) => s.c > p.y);
    const c = C.cells.find((x) => x.i === (i < 0 ? C.V.length : i) && x.j === (j < 0 ? C.Hs.length : j));
    return c && c.d ? { d: c.d } : c && c.water ? { water: 1 } : null;
  };
  const buildingEl = (e: { clientX: number; clientY: number; target: EventTarget | null }): Element | null =>
    (e.target as Element | null)?.closest?.('.b[data-i]')
    ?? (typeof document.elementFromPoint === 'function' ? document.elementFromPoint(e.clientX, e.clientY)?.closest('.b[data-i]') : null)
    ?? null;

  const clearHov = () => {
    svgRef.current?.querySelectorAll('.hov').forEach((x) => x.classList.remove('hov'));
    hov.current = null;
  };
  const onMove = (e: React.PointerEvent) => {
    if (pz.dragging()) return;
    if (C) {
      const h = cityHit(e);
      const k = h ? JSON.stringify(h) : null;
      if (k === hov.current) return;
      clearHov();
      hov.current = k;
      if (!h) { setCard(null); return; }
      if ('d' in h) svgRef.current?.querySelector(`.dist[data-d="${h.d}"]`)?.classList.add('hov');
      setCard(hitCard(C, h));
      return;
    }
    if (!S) return;
    const el = buildingEl(e);
    const k = el?.getAttribute('data-i') ?? null;
    if (k === hov.current) return;
    clearHov();
    hov.current = k;
    if (!el || k == null) { setCard(null); return; }
    el.classList.add('hov');
    const i = +k, b = S.boxes[i], g = buildingInfo(b, i);
    setCard({
      kind: `${g.type} · ${g.floors} ${floorsWord(g.floors)}`, title: buildingTitle(b),
      rows: g.tenants.map((t) => [t.f || '', t.n, t.h ? 'h' : undefined]), empty: 'pusty',
      foot: b.home ? null : { text: '▸ kliknij, żeby zaplanować tu wyjazd', tone: 'acc' },
    });
  };
  const onUp = (e: React.PointerEvent) => {
    if (pz.moved()) return;
    if (C) {
      handled.current = true;
      const h = cityHit(e);
      if (h && 'd' in h) store.apply(openDistrict(store.get(), h.d));
      return;
    }
    if (!S) return;
    const el = buildingEl(e);
    const i = el ? +el.getAttribute('data-i')! : -1;
    if (i >= 0 && !S.boxes[i].home) setGo({ i, msg: null });
  };
  // Klik bez pointerup (np. zdarzenie wysłane wprost na wielokąt dzielnicy): dzielnica z `closest('.dist')`.
  const onClick = (e: React.MouseEvent) => {
    if (!C) return;
    if (handled.current) { handled.current = false; return; }
    const d = (e.target as Element).closest('.dist')?.getAttribute('data-d');
    if (d) store.apply(openDistrict(store.get(), d as DistrictKey));
  };
  const onMini = (e: React.MouseEvent) => {
    const r = miniRef.current!.getBoundingClientRect();
    pz.center(F.x + (e.clientX - r.left) / r.width * F.w, F.y + (e.clientY - r.top) / r.height * F.h);
  };
  const zoomBtn = (f: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    pz.zoomAt(f, r.width / 2, r.height / 2);
  };

  const place = dist ? DISTRICT_META[dist].label : tab === 'poznan' ? 'Poznań' : TIER_META[tab].label;
  const goBox = go && S ? S.boxes[go.i] : null;
  const plan = () => {
    if (!go || !S) return;
    const s = store.get();
    const target: TripTarget = { place: S.key, building: go.i, isTarget: go.i === S.targetIndex };
    const msg = tripBlock(s, target);
    if (msg) setGo({ ...go, msg });
    else store.apply(planTrip(s, target));
  };

  return (
    <div data-screen="mapCity" className="mapscr mc">
      <MapAppBar />
      <div className="tabs">
        <button className="cbtn back" onClick={() => store.apply(toPoland(store.get()))}>← Polska</button>
        {TABS.map(([k, label, tag]) => (
          <button key={k} className={k === tab ? 'on' : ''} onClick={() => store.apply(openCity(store.get(), k))}>
            {label} <small>· {tag}</small>
          </button>
        ))}
      </div>
      <div className={xray ? 'map-stage xray' : 'map-stage'}>
        <svg ref={svgRef} className="map city" onPointerMove={onMove} onPointerUp={onUp} onClick={onClick}
          onPointerLeave={() => { clearHov(); setCard(null); }} dangerouslySetInnerHTML={{ __html: html }} />
        <svg ref={miniRef} className="mini" viewBox={`${F.x} ${F.y} ${F.w} ${F.h}`} onClick={onMini}
          dangerouslySetInnerHTML={{ __html: mini }} />
        {drawn ? null : <div className="loading">wczytuję mapę…</div>}
        <div className="hud">
          <button onClick={() => zoomBtn(1.25)}>+</button>
          <button onClick={() => zoomBtn(0.8)}>−</button>
          <button onClick={() => pz.home()}>⌂ start</button>
          {mode === 'city' ? null : (
            <button className={xray ? 'on' : ''} title="Zrób wysokie budynki półprzezroczystymi" onClick={() => setXray((x) => !x)}>⧉ prześwietl</button>
          )}
        </div>
        <CityInfoCard tab={tab} dist={dist} airport={!!S?.airport}
          onCity={() => store.apply(openDistrict(store.get(), null))}
          onSign={() => { if (S?.airport) { const p = P(S.airport.x, S.airport.y); pz.set({ cx: p[0] - 120, cy: p[1] - 60, zoom: 1.6 }); } }} />
        {card ? <InfoBox card={card} className="mc-info" /> : null}
        <div className="hint">przeciągnij = przesuń · kółko = przybliż · najedź na budynek lub dzielnicę · kliknij, żeby wejść</div>
        {go && goBox ? (
          <GoCard title={`${goBox.label && !goBox.home ? goBox.label : goBox.tower ? 'Wieżowiec' : 'Budynek'} · ${place}`}
            tenants={buildingInfo(goBox, go.i).tenants} msg={go.msg} onCancel={() => setGo(null)} onPlan={plan} />
        ) : null}
      </div>
    </div>
  );
}
