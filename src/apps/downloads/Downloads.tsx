import { missionDef } from '../../engine/missions';
import { useGame } from '../../ui/useGame';
import '../misc.css';

// [decyzja Claude'a] w makiecie brak okna; wygląd jak panel mc (misja.html linia 1359)
export function Downloads() {
  const files = useGame((s) => s.downloads);
  return (
    <div className="dl">
      <div className="ph">~/Pobrane (ten komputer)</div>
      {files.length === 0
        ? <div className="empty">Pusto. Pliki pobierasz w Terminalu poleceniem get.</div>
        : files.map((f) => (
          <div key={`${f.mission}/${f.fileId}`} className="row">
            <div><span>{f.name}</span><span className="d">{f.size}</span></div>
            <small>{f.host} · {missionDef(f.mission).title}</small>
          </div>
        ))}
    </div>
  );
}
