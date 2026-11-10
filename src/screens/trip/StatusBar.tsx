// Pasek stanu wyjazdu (wyjazd.tpl.html 143–148).
import { dur } from '../../engine/clock';
import { hm } from './timing';

type Props = { day: string; now: number; money: number; dev: string; devOn?: boolean; deadline: number };

export function StatusBar({ day, now, money, dev, devOn, deadline }: Props) {
  const left = deadline - now;
  return (
    <div className="status">
      <span className="clk">{day} {hm(now)}</span>
      <span><span className="k">portfel</span><b className="coin-t">{money} ¤</b></span>
      <span><span className="k">PODSŁUCH-1</span><b className={devOn ? 'acc-t' : ''}>{dev}</b></span>
      <span className="dline"><span className="k">termin zlecenia</span><b>{day} {hm(deadline)}</b>{' '}
        <span className="dim-t">{left > 0 ? `· zostało ${dur(Math.round(left))}` : '· po terminie'}</span>
      </span>
    </div>
  );
}
