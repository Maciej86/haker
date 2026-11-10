import { useEffect, useSyncExternalStore } from 'react';
import { useStore } from './useGame';
import './Toast.css';

type ToastItem = { id: number; text: string; bad: boolean };

let items: ToastItem[] = [];
let seq = 0;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export function pushToast(text: string, bad = false): void {
  const id = ++seq;
  items = [...items, { id, text, bad }];
  emit();
  setTimeout(() => {
    items = items.filter((t) => t.id !== id);
    emit();
  }, 3500);
}

const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };

export function ToastHost() {
  const store = useStore();
  const list = useSyncExternalStore(subscribe, () => items);
  useEffect(() => store.onUi((e) => { if (e.kind === 'toast') pushToast(e.text, e.bad); }), [store]);
  useEffect(() => () => { items = []; emit(); }, []);
  return (
    <div id="toast" aria-live="polite">
      {list.map((t) => <div key={t.id} className={t.bad ? 'toast err' : 'toast'}>{t.text}</div>)}
    </div>
  );
}
