import { useSyncExternalStore } from 'react';

// Odpowiedź zleceniodawcy jest już w stanie gry; tu tylko ukrywamy ją na czas „po chwili”.
const hidden = new Set<string>();
let version = 0;
const subs = new Set<() => void>();
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
const bump = () => { version++; subs.forEach((f) => f()); };
const key = (thread: string, html: string) => `${thread}\u0000${html}`;

export function hideMail(thread: string, html: string, ms: number, onShow: () => void): void {
  const k = key(thread, html);
  hidden.add(k);
  bump();
  setTimeout(() => {
    hidden.delete(k);
    bump();
    onShow();
  }, ms);
}

export function useHiddenMail(): (thread: string, html: string) => boolean {
  useSyncExternalStore(subscribe, () => version);
  return (thread, html) => hidden.has(key(thread, html));
}
