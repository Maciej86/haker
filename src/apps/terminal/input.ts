import { useSyncExternalStore } from 'react';
import { useWindows } from '../../ui/windows';
import { pushToast } from '../../ui/Toast';

let value = '';
const subs = new Set<() => void>();
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };

export function setTerminalInput(cmd: string): void {
  value = cmd;
  subs.forEach((f) => f());
}

export function useTerminalInput(): [string, (v: string) => void] {
  return [useSyncExternalStore(subscribe, () => value), setTerminalInput];
}

export function useTypeIn(): (cmd: string) => void {
  const w = useWindows();
  return (cmd) => {
    w.open('terminal');
    setTerminalInput(cmd);
    pushToast('Polecenie wpisane w Terminalu. Zatwierdź Enterem.');
  };
}
