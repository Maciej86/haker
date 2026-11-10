import { gclk, deadlineLabel } from '../../engine/clock';
import { barLabel } from '../../engine/desktop';
import { useGame } from '../../ui/useGame';
import { usePref } from '../../ui/prefs';
import { slots } from './slots';

// misja.html linie 437–447
export function TopBar() {
  const s = useGame((x) => x);
  const [rain, setRain] = usePref('neonos-rain', 'on');
  const dl = deadlineLabel(s);
  const [head, ...rest] = dl ? dl.text.split(' · ') : [];
  return (
    <header id="bar">
      <span className="logo"><i>&gt;_</i>NeonOS</span>
      <span id="mission"><b>Zlecenie</b><span>{barLabel(s)}</span></span>
      <span id="corner">
        {slots('bar').map(({ id, c: C }) => <C key={id} />)}
        <span className="hb" title="Zegar gry. Rusza tylko przy akcjach."><small>zegar</small><span id="gclk">{gclk(s)}</span></span>
        {dl ? (
          <span className="hb" id="dl">
            <small>termin</small><b>{head}</b>
            <span id="dl-left" style={{ color: dl.red ? 'var(--red)' : 'var(--dim)' }}>· {rest.join(' · ')}</span>
          </span>
        ) : null}
      </span>
      <button id="weather" aria-pressed={rain !== 'off'} title="Włącz lub wyłącz deszcz na tapecie"
        onClick={() => setRain(rain === 'off' ? 'on' : 'off')}>☂ Deszcz</button>
    </header>
  );
}
