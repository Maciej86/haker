import { useEffect, useLayoutEffect, useRef, type KeyboardEvent } from 'react';
import { historyNav, promptFor, runLine } from '../../engine/terminal';
import { termMissionLabel, termStepLabel } from '../../engine/desktop';
import { useGame, useStore } from '../../ui/useGame';
import { useTerminalInput } from './input';
import { activeTerminalView } from './views';
import './Terminal.css';

// misja.html linie 484–487 i 1450–1459
export function Terminal() {
  const store = useStore();
  const s = useGame((x) => x);
  const [value, setValue] = useTerminalInput();
  const input = useRef<HTMLInputElement>(null);
  const term = useRef<HTMLDivElement>(null);
  const hi = useRef(s.terminal.history.length);
  const lines = s.terminal.lines;
  const view = activeTerminalView(s);

  useLayoutEffect(() => {
    const el = term.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length]);

  // Fokus przy otwarciu okna i gdy program wpisze polecenie (setTerminalInput).
  useEffect(() => {
    if (input.current && document.activeElement !== input.current) input.current.focus();
  }, [value]);

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const history = store.get().terminal.history;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (Math.min(hi.current, history.length) === 0) return; // jak w makiecie: na początku historii nic się nie zmienia
      }
      const r = historyNav(history, Math.min(hi.current, history.length), e.key === 'ArrowUp' ? 'up' : 'down');
      hi.current = r.index;
      setValue(r.value);
      return;
    }
    if (e.key !== 'Enter') return;
    store.apply(runLine(store.get(), value));
    setValue('');
    hi.current = store.get().terminal.history.length;
  };

  return (
    <div className="termapp">
      <div className="missionbar"><b>Zlecenie:</b><span>{termMissionLabel(s)}</span><span>{termStepLabel(s)}</span></div>
      <div id="term-wrap">
        <div className="body" id="term" ref={term} onClick={() => input.current?.focus()}>
          {/* Każda linia w osobnym <span> z „\n” na końcu: wygląda tak samo jak jeden blok tekstu. */}
          <div className="out">
            {lines.map((l, i) => <span key={i} dangerouslySetInnerHTML={{ __html: l.html + '\n' }} />)}
          </div>
          {view ? null : (
            <div className="line">
              <span className="c">{promptFor(s)}</span>
              <input
                ref={input}
                aria-label="Polecenie"
                autoComplete="off"
                spellCheck={false}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={onKey}
              />
            </div>
          )}
        </div>
        {view ? <div className="termview"><view.component /></div> : null}
      </div>
    </div>
  );
}
