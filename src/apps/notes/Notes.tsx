import { notesView } from '../../engine/desktop';
import { useGame } from '../../ui/useGame';
import { useTypeIn } from '../terminal/input';
import '../misc.css';

// misja.html linie 1443–1445 i 1611–1613
export function Notes() {
  const s = useGame((x) => x);
  const typeIn = useTypeIn();
  const v = notesView(s);
  return (
    <div className="notes">
      <p className="intro">{v.intro}</p>
      {v.cards.map((c) => (
        <div key={c.id}>
          <div className="clue"><span className="src">{c.src}</span><span dangerouslySetInnerHTML={{ __html: c.html }} /></div>
          {c.insert ? <button className="btn" onClick={() => typeIn(c.insert!)}>Wpisz w Terminalu: {c.insert} ›</button> : null}
        </div>
      ))}
      {v.footer ? <p className="foot">{v.footer}</p> : null}
    </div>
  );
}
