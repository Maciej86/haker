// Szafka S1 przy ulicy (wyjazd.tpl.html 307–324). Kolory przez tokeny. Klasy celów: door-lock, slot, dev-rect.
import { memo } from 'react';

export type CabState = { open: boolean; inside: boolean; dev: boolean; led: boolean };

const rows = Array.from({ length: 6 }, (_, r) => r);
const cols = Array.from({ length: 12 }, (_, c) => c);
const MONO = 'JetBrains Mono';

function CabinetImpl({ street, st }: { street: string; st: CabState }) {
  return (
    <svg className="cabinet" viewBox="0 0 400 420">
      <defs>
        <linearGradient id="wallgrad" x1="0" x2="1">
          <stop offset="0" style={{ stopColor: 'var(--trip-wall-top)' }} /><stop offset="1" style={{ stopColor: 'var(--trip-win)' }} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="400" height="420" fill="url(#wallgrad)" />
      {Array.from({ length: 14 }, (_, i) => <path key={i} d={`M0 ${i * 30 + 10}H400`} style={{ stroke: 'var(--trip-wall)' }} />)}
      <rect x="0" y="390" width="400" height="30" style={{ fill: 'var(--trip-floor)' }} />
      <g transform="translate(110 60)">
        <rect x="0" y="0" width="180" height="300" rx="4" strokeWidth="1.5" style={{ fill: 'var(--trip-cab)', stroke: 'var(--trip-cab-edge)' }} />
        <g opacity={st.inside ? 1 : 0.25} style={{ transition: 'opacity .3s' }}>
          {rows.map((r) => (
            <g key={r}>
              <rect x="14" y={18 + r * 40} width="152" height="26" rx="2" style={{ fill: 'var(--trip-cab-row)', stroke: 'var(--trip-cab-row-edge)' }} />
              {cols.map((c) => (
                <g key={c}>
                  <rect x={20 + c * 12} y={24 + r * 40} width="8" height="7" strokeWidth=".6" style={{ fill: 'var(--trip-port)', stroke: 'var(--trip-port-edge)' }} />
                  <circle cx={24 + c * 12} cy={37 + r * 40} r="1.6" style={{ fill: (r * 12 + c) % 5 ? 'var(--trip-led-off)' : 'var(--acc)' }}>
                    <animate attributeName="opacity" values="1;.2;1" dur={`${(0.6 + ((r * 7 + c * 3) % 9) / 10).toFixed(1)}s`} repeatCount="indefinite" />
                  </circle>
                </g>
              ))}
            </g>
          ))}
          <rect className="tgt slot" x="44" y="258" width="92" height="22" rx="2" strokeDasharray="3 2" style={{ fill: 'var(--trip-port)', stroke: 'var(--coin)' }} />
          {st.dev ? null : <text x="90" y="294" textAnchor="middle" fontSize="8" fontFamily={MONO} style={{ fill: 'var(--coin)' }}>wolny port</text>}
        </g>
        <g transform="translate(44 258)" opacity={st.dev ? 1 : 0}>
          <rect className="tgt dev-rect" width="92" height="22" rx="3" style={{ fill: 'var(--trip-dev)', stroke: 'var(--acc)' }} />
          <text x="8" y="15" fontSize="9" fontFamily={MONO} style={{ fill: 'var(--acc)' }}>PODSŁUCH-1</text>
          <circle className="led" cx="82" cy="11" r="3" style={{ fill: st.led ? 'var(--acc)' : 'var(--coin)' }}>
            {st.led ? null : <animate attributeName="opacity" values="1;.2;1" dur=".6s" repeatCount="indefinite" />}
          </circle>
        </g>
        <g style={{ transformOrigin: '0px 0px', transition: 'transform 1.1s ease-in-out', transform: st.open ? 'scaleX(.06)' : 'none' }}>
          <rect x="0" y="0" width="180" height="300" rx="4" strokeWidth="1.5" style={{ fill: 'var(--trip-cab-door)', stroke: 'var(--trip-cab-door-edge)' }} />
          <rect className="tgt door-lock" x="146" y="132" width="18" height="36" rx="3" style={{ fill: 'var(--trip-win)', stroke: 'var(--trip-cab-door-edge)' }} />
          <circle cx="155" cy="150" r="3" style={{ fill: 'var(--trip-cab-door-edge)' }} />
          <text x="90" y="40" textAnchor="middle" fontSize="13" fontFamily={MONO} style={{ fill: 'var(--trip-label)' }}>NET-OPERATOR</text>
          <text x="90" y="58" textAnchor="middle" fontSize="9" fontFamily={MONO} style={{ fill: 'var(--dim)' }}>szafka S1 · nie otwierać</text>
          <path d="M78 90l12-20 12 20z" fill="none" style={{ stroke: 'var(--coin)' }} />
          <text x="90" y="87" textAnchor="middle" fontSize="9" style={{ fill: 'var(--coin)' }}>!</text>
        </g>
      </g>
      <text x="200" y="408" textAnchor="middle" fontSize="11" fontFamily={MONO} style={{ fill: 'var(--dim)' }}>{street}</text>
    </svg>
  );
}

export const Cabinet = memo(CabinetImpl);
