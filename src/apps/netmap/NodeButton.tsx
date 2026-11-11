import type { TowerNode } from '../../world/tower';
import { Bars } from './Bars';

export type NodeLook = { checked: boolean; target: boolean; crossed: boolean; match: boolean | null; sel: boolean };

// misja.html linie 1031–1033
export function NodeButton({ n, look, now, onSelect }: { n: TowerNode; look: NodeLook; now: number; onSelect: () => void }) {
  const cls = [
    'nd',
    look.checked ? (look.target ? 'hit' : 'bad') : look.crossed ? 'x' : '',
    look.match === null ? '' : look.match ? 'inf' : 'off',
    look.sel ? 'sel' : '',
  ].filter(Boolean).join(' ');
  const who = look.checked ? `${look.target ? '✓ ' : '✗ '}${n.kto}` : look.crossed ? 'skreślony' : '';
  return (
    <button className={cls} data-ip={n.ip} onClick={onSelect}>
      <span className="top"><span className="sh">{n.sh}</span><span className="ip">{n.ip}</span></span>
      <span className="who">{who}</span>
      <Bars akt={n.akt} now={now} className="spark" />
    </button>
  );
}
