import type { FC } from 'react';
import { wytrychView, type WytrychView } from '../../engine/wytrych';
import { useGame } from '../../ui/useGame';
import { WYTRYCH_MODES } from './modes';
import './wytrych.css';

// misja.html linie 1605–1607: bez celu „Brak celu.”, inaczej panel trybu z rejestru
export function Wytrych() {
  const s = useGame((x) => x);
  const v = wytrychView(s);
  if (v.mode === 'none') {
    return (
      <div className="wyt-bake">
        <div className="eqs"><div className="wyt-none"><span>Brak celu.</span><br />Wpisz w Terminalu <b>crack &lt;ip&gt;</b>.</div></div>
        <div className="crkside" />
      </div>
    );
  }
  const Mode = WYTRYCH_MODES[v.mode] as FC<{ view: WytrychView }> | undefined;
  return Mode ? <Mode view={v} /> : null;
}
