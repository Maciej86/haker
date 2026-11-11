import { useEffect, useRef } from 'react';
import { missionDef } from '../engine/missions';
import { realtimeSpeed } from '../engine/realtime';
import { hideMail } from '../apps/mail/delayed';
import { setTerminalInput } from '../apps/terminal/input';
import { startTermHold } from '../apps/terminal/hold';
import { pushToast } from './Toast';
import { useStore } from './useGame';
import { useWindows } from './windows';

export function useUiEvents(): void {
  const store = useStore();
  const windows = useWindows();
  const ref = useRef(windows);
  ref.current = windows;

  useEffect(() => store.onUi((e) => {
    if (e.kind === 'open') ref.current.open(e.app);
    else if (e.kind === 'typeInTerminal') {
      ref.current.open('terminal');
      setTerminalInput(e.cmd);
      pushToast('Polecenie wpisane w Terminalu. Zatwierdź Enterem.');
    } else if (e.kind === 'termHold') {
      startTermHold(e);
    } else if (e.kind === 'mailArrives') {
      const speed = e.exact ? 1 : realtimeSpeed(typeof location === 'undefined' ? '' : location.search);
      hideMail(e.thread, e.msg.html, e.delayMs / speed, () => {
        const t = e.toast !== undefined ? e.toast : missionDef(e.thread).offer.giverAnswer.toast;
        if (t) pushToast(t);
      });
    }
  }), [store]);
}
