import { useGame } from '../../ui/useGame';
import { useRestart } from '../../ui/restart';
import { endView } from './endView';
import { TypedLog } from './TypedLog';
import './Overlay.css';

// misja.html linie 1630–1640
export function End() {
  const overlay = useGame((s) => s.overlay);
  const s = useGame((x) => x);
  const restart = useRestart();
  if (overlay !== 'end') return null;
  const v = endView(s);
  return (
    <div className="ovl" role="dialog" aria-label="Koniec demo">
      <div className="card">
        <TypedLog lines={v.log} />
        <div className="xp"><b>{v.head}</b><span><i className="coin">¤</i>{v.money}</span></div>
        <div className="bons">
          <div className="head">{v.header}</div>
          {v.done.map((d) => <div key={d} className="bon ok"><span>{d}</span><span /></div>)}
          <div className="bon"><span>Doświadczenie</span><span>{v.xp}</span></div>
          <div className="sec">Umiejętności</div>
          {v.skills.map(([sk, val]) => <div key={sk} className="bon"><span>{sk}</span><span>{val}</span></div>)}
          {v.bug ? <div className="bon"><span>{v.bug}</span><span /></div> : null}
        </div>
        <div className="acts"><button className="btn" onClick={restart}>Zagraj od nowa</button></div>
      </div>
    </div>
  );
}
