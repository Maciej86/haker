import { useState } from 'react';
import { APPS } from '../../apps/registry';
import type { AppId } from '../../engine/types';
import { useGame } from '../../ui/useGame';
import { useWindows } from '../../ui/windows';
import { StartMenu } from './StartMenu';

// Otwarte okna w stałej kolejności (jak w makiecie: kolejność okien w DOM), nie w kolejności warstw.
export function openApps(order: AppId[]): AppId[] {
  return (Object.keys(APPS) as AppId[]).filter((id) => order.includes(id));
}

// misja.html linie 589–605 i 742–746
export function TaskBar() {
  const hw = useGame((s) => s.hw);
  const windows = useWindows();
  const [menu, setMenu] = useState(false);
  // Menu Start poza paskiem: ma własną warstwę 60 (pasek ma 50).
  return (
    <>
      <footer id="taskbar">
        <button className="start" onClick={() => setMenu((v) => !v)}>≡ Start</button>
        <span id="tasks" style={{ display: 'flex', gap: 4 }}>
          {openApps(windows.order).map((id) => (
            <button key={id} className={windows.isActive(id) ? 'task active' : 'task'} onClick={() => windows.focus(id)}>
              {APPS[id].title}
            </button>
          ))}
        </span>
        {/* Zadanie 18: <DevPanel /> */}
        <span className="net">{hw.netName} {hw.net} Mb/s</span>
      </footer>
      {menu ? <StartMenu onClose={() => setMenu(false)} /> : null}
    </>
  );
}
