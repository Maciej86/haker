import { useMemo } from 'react';
import { clockJump, clockView, type ClockView } from '../../engine/missions';
import { useGame, useStore } from '../../ui/useGame';
import { useWindows } from '../../ui/windows';
import './clock.css';

const NOTE_CLASS = { dim: undefined, text: 'bc-note-text', red: 'bc-note-red' } as const;

/** Duży zegar (misja.html linia 587, style 241–245). `fixed`: na pulpicie, nad oknami. */
export function ClockPanel({ view, onJump, fixed }: { view: ClockView; onJump: () => void; fixed: boolean }) {
  const cls = ['bigclock', fixed ? 'fixed' : null, view.live ? 'live' : null].filter(Boolean).join(' ');
  return (
    <div id={fixed ? 'bigclock' : undefined} className={cls} role="timer" aria-live="off">
      <div>
        <div className="bc-t">{view.time}</div>
        <div className="bc-l" dangerouslySetInnerHTML={{ __html: view.html }} />
      </div>
      <div className="bc-act">
        {view.jump && <button type="button" className="btn" onClick={onJump}>{view.jump}</button>}
        {view.note && <small className={NOTE_CLASS[view.note.tone]} dangerouslySetInnerHTML={{ __html: view.note.html }} />}
      </div>
    </div>
  );
}

/** Widok zegara z całego stanu: selektor zwracający nowy obiekt zapętliłby useSyncExternalStore. */
function useClock(): [ClockView | null, () => void] {
  const store = useStore();
  const s = useGame((x) => x);
  const view = useMemo(() => clockView(s), [s]);
  return [view, () => store.apply(clockJump(store.get()))];
}

/** Slot pulpitu: zegar nad oknami, tylko w zleceniu z oknem czasowym i gdy okno Zegara jest zamknięte. */
export function BigClock() {
  const [view, onJump] = useClock();
  const inWindow = useWindows().isOpen('clock');
  return view && !inWindow ? <ClockPanel view={view} onJump={onJump} fixed /> : null;
}

/** Aplikacja „Zegar”: ten sam zegar w oknie. */
export function ClockApp() {
  const [view, onJump] = useClock();
  if (!view) return <div className="clock-empty">Zegar pojawi się w zleceniu z oknem czasowym.</div>; // [decyzja]
  return <div className="clock-app"><ClockPanel view={view} onJump={onJump} fixed={false} /></div>;
}
