import type { GameState, StepResult } from '../../engine/types';
import type { NetSide } from '../../engine/missions';
import { BRANCHES, SHAPE_NAMES, type TowerNode } from '../../world/tower';
import { Button } from '../../ui/Button';
import { Bars } from './Bars';

export type SideActions = { type: (cmd: string) => void; act: (f: (s: GameState) => StepResult) => void };

/** Blok z panelu misji (karta celu, podpowiedzi): HTML gry i przyciski (cmd → Terminal, act → magazyn). */
export function SideBlock({ side, actions, className, btnClass }: { side: NetSide; actions: SideActions; className?: string; btnClass?: string }) {
  return (
    <div className={className}>
      <div dangerouslySetInnerHTML={{ __html: side.html }} />
      {(side.buttons ?? []).map((b, i) => (
        <div key={i}>
          <Button className={btnClass} style={{ marginTop: 8, whiteSpace: 'normal', textAlign: 'left' }}
            onClick={() => (b.cmd ? actions.type(b.cmd) : b.act ? actions.act(b.act) : undefined)}>
            {b.label}
          </Button>
          {b.hint ? <div className="cmdhint" dangerouslySetInnerHTML={{ __html: b.hint }} /> : null}
        </div>
      ))}
    </div>
  );
}

type Props = {
  n: TowerNode | undefined; now: number; checked: boolean; target: boolean; crossed: boolean;
  hideActs: boolean; onCross: () => void; onProbe: () => void;
};

// misja.html linie 1041–1055 (karta celu `top` rysuje NetMap nad tym panelem)
export function NodeDetail({ n, now, checked, target, crossed, hideActs, onCross, onProbe }: Props) {
  if (!n) {
    return (
      <>
        <h3>Urządzenie</h3>
        <p style={{ color: 'var(--dim)', fontSize: 12, margin: 0 }}>Kliknij urządzenie na schemacie. Żółty słupek na wykresie aktywności to bieżąca godzina.</p>
      </>
    );
  }
  const branch = BRANCHES.find((b) => b[0] === n.net)?.[1] ?? `10.42.${n.net}.x`;
  return (
    <>
      <h3>Urządzenie</h3>
      <div className="row2"><span>adres</span><span>{n.ip}</span></div>
      <div className="row2"><span>kształt</span><span>{`${n.sh} ${SHAPE_NAMES[n.sh]}`}</span></div>
      <div className="row2"><span>podsieć</span><span>{branch}</span></div>
      {checked ? (
        <div className="row2"><span>to jest</span><span style={{ color: target ? 'var(--acc)' : 'var(--red)' }}>{n.kto}</span></div>
      ) : null}
      <Bars akt={n.akt} now={now} className="chart" />
      <div className="axis"><span>0</span><span>6</span><span>12</span><span>18</span><span>24</span></div>
      <div className="acts">
        {checked || hideActs ? null : (
          <>
            <Button onClick={onCross}>{crossed ? 'Przywróć' : 'Skreśl'} <span style={{ color: 'var(--dim)' }}>· za darmo</span></Button>
            <Button disabled={crossed} onClick={onProbe}>Sprawdź w Terminalu ›</Button>
            <div className="cmdhint">wpisze <code>probe {n.ip}</code> · 6 min gry · 3 min urządzenia</div>
          </>
        )}
      </div>
    </>
  );
}
