import { APPS, MAP_ICON, visibleIcons } from '../../apps/registry';
import { appBadge, goMap } from '../../engine/desktop';
import { useGame, useStore } from '../../ui/useGame';
import { useWindows } from '../../ui/windows';

// misja.html linie 449–461
export function Icons() {
  const s = useGame((x) => x);
  const store = useStore();
  const windows = useWindows();
  return (
    <nav id="icons" aria-label="Pulpit">
      {visibleIcons(s).map((id) => {
        const a = id === 'map' ? MAP_ICON : APPS[id];
        const badge = id === 'map' ? appBadge(s, 'map') : APPS[id].badge?.(s) ?? null;
        const red = id !== 'map' && APPS[id].tone === 'red';
        return (
          <button
            key={id}
            className={red ? 'ico red' : 'ico'}
            onClick={() => (id === 'map' ? store.apply(goMap(store.get())) : windows.open(id))}
          >
            <span className="tile">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" dangerouslySetInnerHTML={{ __html: a.icon }} />
              {badge ? <i className="badge">{badge}</i> : null}
            </span>
            {a.title}
          </button>
        );
      })}
    </nav>
  );
}
