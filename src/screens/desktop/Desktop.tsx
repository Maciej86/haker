import { APPS } from '../../apps/registry';
import { useGame } from '../../ui/useGame';
import { useWindows } from '../../ui/windows';
import { Window } from '../../ui/Window';
import { ToastHost } from '../../ui/Toast';
import { GainBubble } from '../../ui/GainBubble';
import { Wallpaper } from './Wallpaper';
import { Rain } from './Rain';
import { TopBar } from './TopBar';
import { Icons } from './Icons';
import { PlayerPanel } from './PlayerPanel';
import { TaskBar, openApps } from './TaskBar';
import { slots } from './slots';
import './Desktop.css';

function Windows() {
  const s = useGame((x) => x);
  const windows = useWindows();
  // Stała kolejność w DOM: przestawianie węzłów przy zmianie warstwy gubiłoby fokus (np. w polu Terminala).
  return (
    <>
      {openApps(windows.order).map((id) => {
        const a = APPS[id];
        const C = a.component;
        return (
          <Window key={id} app={id} label={a.title} title={a.winTitle?.(s) ?? a.title} icon={a.icon} tone={a.tone}>
            <C />
          </Window>
        );
      })}
    </>
  );
}

// Zdarzenia UI (useUiEvents) obsługuje Game w App.tsx przez całą sesję, także poza pulpitem.
export function Desktop() {
  return (
    <div data-screen="desktop">
      <Wallpaper />
      <Rain />
      <TopBar />
      <Icons />
      <Windows />
      {slots('desktop').map(({ id, c: C }) => <C key={id} />)}
      <PlayerPanel />
      <TaskBar />
      <ToastHost />
      <GainBubble />
    </div>
  );
}
