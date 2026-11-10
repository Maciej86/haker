// Oś czasu wyjazdu (wyjazd.tpl.html 251–258): od pełnej godziny przed wyjściem do pełnej godziny po powrocie.
import type { Leg, LegId } from '../../engine/trip';
import { hm } from './timing';

const COL: Record<LegId, string> = {
  drive2: 'var(--blue)', walk1: 'var(--acc)', wait1: 'var(--trip-tl-wait)', ride1: 'var(--blue)',
  park: 'var(--trip-tl-wait)', walk2: 'var(--acc)', site: 'var(--coin)', back: 'var(--trip-tl-back)',
};
const KEY: [string, string][] = [
  ['var(--acc)', 'pieszo'], ['var(--blue)', 'przejazd'], ['var(--trip-tl-wait)', 'czekanie'],
  ['var(--coin)', 'na miejscu'], ['var(--trip-tl-back)', 'powrót'],
];

type Props = { legs: Leg[]; start: number; end: number; deadline: number; now: number; current: LegId | null };

export function Timeline({ legs, start, end, deadline, now, current }: Props) {
  const a = Math.floor(start / 60) * 60;
  const b = Math.max(a + 6 * 60, Math.ceil(Math.max(end, deadline + 60) / 60) * 60);
  const x = (m: number) => `${((m - a) / (b - a) * 100).toFixed(2)}%`;
  const hours: number[] = [];
  for (let m = a; m <= b; m += 60) hours.push(m);
  return (
    <>
      <div className="tl-track">
        {hours.map((m) => (
          <span key={m}><i className="tl-h" style={{ left: x(m) }} /><i className="tl-hl" style={{ left: x(m) }}>{hm(m)}</i></span>
        ))}
        {legs.map((l) => (
          <i key={l.id} className="tl-leg" title={l.name} style={{
            left: x(l.t0), width: `calc(${x(l.t1)} - ${x(l.t0)})`, background: COL[l.id],
            opacity: current && current !== l.id ? 0.45 : 1, outline: current === l.id ? '1px solid var(--trip-tl-cur)' : 'none',
          }} />
        ))}
        <i className="tl-dl" style={{ left: x(deadline) }} />
        <i className="tl-dlt" style={{ left: x(deadline) }}>termin {hm(deadline)}</i>
        <i className="tl-now" style={{ left: `${(now - a) / (b - a) * 100}%` }} />
      </div>
      <div className="tl-key">
        {KEY.map(([c, n]) => <span key={n}><i style={{ background: c }} /> {n}</span>)}
      </div>
    </>
  );
}
