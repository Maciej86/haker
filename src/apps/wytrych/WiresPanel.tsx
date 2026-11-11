import { useRef, type MouseEvent } from 'react';
import { typeInTerminal } from '../../engine/help';
import { wytrychAct, type WytrychView } from '../../engine/wytrych';
import { useStore } from '../../ui/useGame';
import { ROT, powered } from '../../engine/wires';

type Props = { view: Extract<WytrychView, { mode: 'wires' }> };
type Last = { board: number[][]; lit: string[]; inRow: number; outRow: number; moves: number; sec: number };

const ROWS = 5;
const COLS = 7;
const TITLE = 'klik: obróć w prawo · prawy klik: w lewo';
/** Odcinki przewodu w kafelku: N=1 E=2 S=4 W=8 (misja.html linia 1152). */
const PATHS: [number, string][] = [[1, 'M27 27V0'], [2, 'M27 27H54'], [4, 'M27 27V54'], [8, 'M27 27H0']];
const top = (row: number) => 10 + row * 57 + 27;

function Pipe({ m }: { m: number }) {
  return <svg viewBox="0 0 54 54">{PATHS.filter(([b]) => m & b).map(([b, d]) => <path key={b} d={d} />)}</svg>;
}

// misja.html linie 1152–1177 (renderBoard, renderCrackSide); CSS 320–337 pod korzeniem .wyt-wires
export function WiresPanel({ view }: Props) {
  const w = view.wires;
  const store = useStore();
  // Po końcu próby silnik nie trzyma planszy: karta wyniku pokazuje ostatnią planszę z tego okna (jeśli była widoczna).
  const last = useRef<Last | null>(null);
  if (w.on) last.current = { board: w.board, lit: w.lit, inRow: w.inRow, outRow: w.outRow, moves: w.moves, sec: w.sec };
  const b = last.current;
  const board = b?.board ?? Array.from({ length: ROWS }, () => Array<number>(COLS).fill(0));
  const lit = new Set(b?.lit ?? []);
  const oct = w.target.split('.').pop() ?? '';
  const type = (cmd: string) => store.apply(typeInTerminal(store.get(), cmd));
  const turn = (r: number, c: number, dir: 1 | 3) => {
    // Zwycięski obrót kończy próbę w tym samym kroku (crack: null): zapamiętaj planszę już po obrocie.
    const p = last.current;
    if (w.on && p?.board[r]?.[c] !== undefined) {
      const nb = p.board.map((row, i) => row.map((m, j) => {
        if (i !== r || j !== c) return m;
        let x = m;
        for (let k = 0; k < dir; k++) x = ROT(x);
        return x;
      }));
      last.current = { ...p, board: nb, lit: powered(nb, p.inRow, p.outRow).set, moves: p.moves + 1 };
    }
    store.apply(wytrychAct(store.get(), { kind: 'turn', r, c, dir }));
  };
  const onCtx = (e: MouseEvent, r: number, c: number) => { e.preventDefault(); turn(r, c, 3); };
  const st = w.on ? null : w.res;

  return (
    <div className="wyt-wires">
      <div className={w.res === 'ok' && !w.on ? 'board won' : 'board'}>
        <div className="grid" style={{ gridTemplateColumns: `repeat(${COLS},54px)` }}>
          {board.map((row, i) => row.map((m, j) => (
            <button key={`${i},${j}`} type="button" className={lit.has(`${i},${j}`) ? 'cell pw' : 'cell'} title={TITLE}
              disabled={!w.on} onClick={() => turn(i, j, 1)} onContextMenu={(e) => onCtx(e, i, j)}>
              <Pipe m={m} />
            </button>
          )))}
        </div>
        {b && <span className="pin in" style={{ top: top(b.inRow) }}>S1 ━</span>}
        {b && <span className="pin out" style={{ top: top(b.outRow) }}>━ ◆ .{oct}</span>}
      </div>
      <div className="crkside">
        <div>
          <h3>Zadanie</h3>Obracaj kafelki, aż sygnał z <b className="t-acc">S1</b> dojdzie do serwera <b className="t-coin tgt">◆ .{oct}</b>. Podświetlone przewody już niosą sygnał.<br />
          <span className="t-dim">klik: w prawo · prawy klik: w lewo</span>
        </div>
        <div>
          <h3>Namierzanie</h3><div className="bigtrace"><i style={{ width: `${w.trace}%` }} /></div>
          <span className="t-dim">rośnie samo (~{w.rate.toFixed(1)}%/s na {w.net} Mb/s) i o 1% za każdy obrót
            {w.alert && <><br /><span className="t-red">bank czujny po poprzedniej próbie: +25%</span></>}</span>
        </div>
        <div>
          <h3>Ta próba</h3>obroty: {b?.moves ?? 0} · czas: {b?.sec ?? 0} s<br />
          <span className="t-dim">co 10 s: 1 min gry i 1 min urządzenia</span>
        </div>
        {st === 'ok' && (
          <div className="crkres">
            <b className="t-acc">Dostęp uzyskany</b><br />Serwer plików stoi otworem. Namierzanie wstrzymane na {Math.round(w.trace)}%: każde polecenie na serwerze je podnosi.<br />
            <button type="button" className="btn" onClick={() => type('mc')}>Otwórz pliki (mc) ›</button>
          </div>
        )}
        {st === 'caught' && (
          <div className="crkres bad">
            <b className="t-red">Namierzono cię. Połączenie zerwane.</b><br />−15 min gry, −5 min urządzenia. Bank jest czujniejszy: następna próba namierza szybciej.<br />
            <button type="button" className="btn" onClick={() => type(`crack ${w.target}`)}>Spróbuj ponownie ›</button>
          </div>
        )}
        {st === 'abort' && (
          <div className="crkres bad">
            <b className="t-coin">Przerwano</b><br />Namierzanie opada. Plansza przy kolejnej próbie będzie nowa.<br />
            <button type="button" className="btn" onClick={() => type(`crack ${w.target}`)}>Spróbuj ponownie ›</button>
          </div>
        )}
        {w.on && <div><button type="button" className="btn red" onClick={() => type('abort')}>Przerwij (abort) ›</button></div>}
      </div>
    </div>
  );
}
