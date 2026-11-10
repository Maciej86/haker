import { useEffect, useRef, useState } from 'react';
import { THEMES, applyTheme, pickTheme } from '../../theme/themes';
import { usePref } from '../../ui/prefs';
import { useProfile } from '../../ui/useProfile';
import { useRestart } from '../../ui/restart';

// misja.html linie 606–609 i 1679–1691
export function StartMenu({ onClose }: { onClose: () => void }) {
  const { unlocked } = useProfile();
  const [saved] = usePref('neonos-theme', 'fosfor');
  const [coach, setCoach] = usePref('neonos-coach', 'on');
  const [confirm, setConfirm] = useState(false);
  const restart = useRestart();
  const theme = pickTheme(saved, unlocked);

  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const down = (e: PointerEvent) => {
      if (!(e.target as Element | null)?.closest?.('#startmenu, #taskbar .start')) close.current();
    };
    document.addEventListener('pointerdown', down);
    return () => document.removeEventListener('pointerdown', down);
  }, []);

  return (
    <div id="startmenu" className="card open" role="dialog" aria-label="Ustawienia">
      <h3>Ustawienia</h3>
      <label className="opt">
        <input type="checkbox" checked={coach !== 'off'} onChange={(e) => setCoach(e.target.checked ? 'on' : 'off')} />
        {' '}Podpowiedzi „co teraz” w karcie Postęp zlecenia
      </label>
      <h3 style={{ marginTop: 10 }}>Motyw</h3>
      <div id="themes">
        {THEMES.map((t) => {
          const open = unlocked.includes(t.id);
          const cur = theme === t.id;
          return (
            <button key={t.id} className="theme" aria-pressed={cur} disabled={!open} onClick={() => applyTheme(t.id)}>
              <span className="sw">{t.sw.map((c, i) => <i key={i} style={{ background: c }} />)}</span>
              <span>{t.name}<small>{t.req ? (open ? `Nagroda za misję ${t.req}` : `Ukończ misję ${t.req}`) : 'Domyślny'}</small></span>
              <span className="st">{cur ? '✓' : open ? '' : '🔒'}</span>
            </button>
          );
        })}
      </div>
      {/* [decyzja Claude'a] nowa gra z potwierdzeniem; w makiecie jej nie ma */}
      <div className="newgame">
        {confirm ? (
          <>
            <p>Zacząć od nowa? Postęp tej gry zniknie. Motywy i osiągnięcia zostają.</p>
            <button className="btn red" onClick={() => { restart(); setConfirm(false); onClose(); }}>Tak, od nowa</button>{' '}
            <button className="btn" onClick={() => setConfirm(false)}>Anuluj</button>
          </>
        ) : (
          <button className="btn red" onClick={() => setConfirm(true)}>Zagraj od nowa</button>
        )}
      </div>
    </div>
  );
}
