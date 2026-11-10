import { Suspense, useLayoutEffect, useMemo } from 'react';
import { Mobile } from './screens/mobile/Mobile';
import type { Store } from './engine/store';
import { safeStorage } from './boot';
import { rectFor } from './apps/registry';
import { Desktop } from './screens/desktop/Desktop';
import { screenComponent } from './screens/registry';
import { Summary } from './screens/overlays/Summary';
import { End } from './screens/overlays/End';
import { Pause } from './screens/overlays/Pause';
import { useIsNarrow } from './ui/useIsNarrow';
import { StoreContext, useGame } from './ui/useGame';
import { ProfileProvider } from './ui/useProfile';
import { WindowsProvider, useWindows } from './ui/windows';
import { useRealtime } from './ui/useRealtime';
import { useUiEvents } from './ui/useUiEvents';
import { ToastHost } from './ui/Toast';

function Game({ store, fresh }: { store: Store; fresh: boolean }) {
  const { paused, resume } = useRealtime(store);
  const windows = useWindows();
  const screen = useGame((s) => s.screen);
  // Zdarzenia UI (okna, „odpisał po chwili”) przez całą sesję, na każdym ekranie.
  useUiEvents();
  useLayoutEffect(() => {
    windows.reset(fresh ? ['terminal', 'mail'] : ['terminal']);
    // tylko przy pierwszym montażu
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let body;
  if (screen === 'desktop') body = <Desktop />;
  else {
    const Screen = screenComponent(screen);
    // Pulpit ma własny ToastHost; poza nim toasty pokazuje ten.
    body = <><Suspense fallback={null}><Screen /></Suspense><ToastHost /></>;
  }
  return (
    <div data-testid="game">
      {body}
      <Summary />
      <End />
      {paused ? <Pause onResume={resume} /> : null}
    </div>
  );
}

export default function App({ store, fresh }: { store: Store; fresh: boolean }) {
  const narrow = useIsNarrow();
  const storage = useMemo(safeStorage, []);
  // Stan gry żyje poza Reactem, więc przełączenie ekranu go nie gubi.
  return (
    <StoreContext.Provider value={store}>
      <ProfileProvider storage={storage}>
        <WindowsProvider rectFor={rectFor}>
          {narrow ? <Mobile /> : <Game store={store} fresh={fresh} />}
        </WindowsProvider>
      </ProfileProvider>
    </StoreContext.Provider>
  );
}
