import { dlProgress, onServer } from '../../engine/server';
import { useGame } from '../../ui/useGame';

// misja.html linia 441 (#trc), CSS 312–319, logika 1165–1166: licznik namierzania w górnym pasku.
export function TraceMeter() {
  const trace = useGame((s) => s.srv.trace);
  const crack = useGame((s) => s.srv.crack !== null);
  const dl = useGame(dlProgress);
  const on = useGame(onServer);
  if (!(trace > 0 || crack || dl !== null || on)) return null;
  const cls = ['hb', crack && trace > 70 && 'hot', !crack && dl === null && 'pause'].filter(Boolean).join(' ');
  return (
    <span className={cls} id="trc" title="Namierzanie. Przy 100% połączenie zostaje zerwane.">
      <small>namierzanie</small>
      <span className="meter"><i style={{ width: `${trace}%` }} /></span>
      <b>{Math.round(trace)}%</b>
      {dl !== null && <small className="trc-dl">· pobieranie {dl}%</small>}
    </span>
  );
}
