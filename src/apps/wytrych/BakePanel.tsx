import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { typeInTerminal } from '../../engine/help';
import { wytrychAct, type BakeItem, type WytrychView } from '../../engine/wytrych';
import { useStore } from '../../ui/useGame';
import { BAKE_ICONS, BAKE_NAMES, type BakeGood } from './bakeIcons';

type Props = { view: Extract<WytrychView, { mode: 'bake' }> };

const isGood = (x: BakeItem): x is BakeGood => x in BAKE_ICONS;
const LEGEND: BakeGood[] = ['chleb', 'bulka', 'rogal'];

// misja.html linie 1586–1600 (renderBake, bakeTry)
export function BakePanel({ view }: Props) {
  const b = view.bake;
  const store = useStore();
  const [value, setValue] = useState('');
  const [shake, setShake] = useState(false);
  const eqsRef = useRef<HTMLDivElement>(null);
  const inRef = useRef<HTMLInputElement>(null);
  const prevTries = useRef(b.tries);

  useEffect(() => { if (!b.won) inRef.current?.focus(); }, [b.won]);
  useEffect(() => {
    const grew = b.tries > prevTries.current;
    prevTries.current = b.tries;
    if (!grew || b.won || !b.wrong) return;
    const el = eqsRef.current;
    if (el && el.classList.contains('shake')) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
    setShake(true);
  }, [b.tries, b.won, b.wrong]);

  const submit = () => store.apply(wytrychAct(store.get(), { kind: 'answer', value }));
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') submit(); };

  return (
    <div className="wyt-bake">
      <div ref={eqsRef} className={['eqs', b.won && 'won', shake && !b.won && 'shake'].filter(Boolean).join(' ')} onAnimationEnd={() => setShake(false)}>
        {b.rows.map((r, i) => (
          <div key={i} className={r.result === null ? 'eq last' : 'eq'}>
            {r.items.map((x, j) => isGood(x)
              ? <span key={j} className="ic" dangerouslySetInnerHTML={{ __html: BAKE_ICONS[x] }} />
              : <span key={j} className="op">{x}</span>)}
            <span className="op eqsign">=</span>
            {r.result === null
              ? <span className="res"><input ref={inRef} inputMode="numeric" maxLength={3} aria-label="Hasło: wynik ostatniego równania"
                  value={b.won ? String(b.answer) : value} disabled={b.won} onChange={(e) => setValue(e.target.value)} onKeyDown={onKey} /></span>
              : <span className="res">{r.result}</span>}
          </div>
        ))}
      </div>
      <div className="crkside">
        <div><h3>Zadanie</h3>Zenek ma hasło z podpowiedzią: zagadkę z piekarni. Policz, ile wart jest każdy wypiek. <b style={{ color: 'var(--acc)' }}>Hasło to wynik ostatniego równania.</b></div>
        <div className="legendk">
          {LEGEND.map((g) => <span key={g} dangerouslySetInnerHTML={{ __html: BAKE_ICONS[g] + BAKE_NAMES[g] }} />)}
        </div>
        <div><h3>Namierzanie</h3><span style={{ color: 'var(--acc)' }}>brak</span> <span style={{ color: 'var(--dim)' }}>· prywatny serwer domowy nikogo nie pilnuje. Zła odpowiedź nic nie kosztuje. W firmach i bankach Wytrych pracuje pod presją namierzania.</span></div>
        {b.won ? (
          <div className="crkres">
            <b style={{ color: 'var(--acc)' }}>Hasło złamane: {b.answer}</b><br />Jesteś na serwerze Zenka.<br />
            <button className="btn" style={{ marginTop: 8 }} onClick={() => store.apply(typeInTerminal(store.get(), 'ls'))}>Lista plików (ls) ›</button>
          </div>
        ) : (
          <>
            <div>
              <button className="btn" onClick={submit}>Wpisz hasło ›</button> <span style={{ color: 'var(--dim)' }}>{b.tries ? `prób: ${b.tries}` : ''}</span>
              <div>{b.wrong !== null && <span style={{ color: 'var(--red)' }} dangerouslySetInnerHTML={{ __html: `Złe hasło (${b.wrong}). Policz jeszcze raz.` }} />}</div>
            </div>
            <div>
              <h3>Podpowiedź</h3>
              {b.hints.map((h, i) => <div key={i} className="hintk">{h}</div>)}
              {b.hintsLeft > 0 && (
                <button className="btn" style={{ marginTop: 6 }} onClick={() => store.apply(wytrychAct(store.get(), { kind: 'hint' }))}>
                  {b.hints.length ? 'Następna podpowiedź' : 'Pokaż podpowiedź'} · za darmo
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
