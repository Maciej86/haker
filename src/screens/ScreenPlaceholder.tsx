import { goDesktop } from '../engine/desktop';
import type { Screen } from '../engine/types';
import { useStore } from '../ui/useGame';

export function ScreenPlaceholder({ screen }: { screen: Screen }) {
  const store = useStore();
  return (
    <div data-screen={screen} style={{ padding: 24, color: 'var(--dim)' }}>
      <p>Ten ekran powstaje.</p>
      <button className="btn" onClick={() => store.apply(goDesktop(store.get()))}>✕ wróć na pulpit</button>
    </div>
  );
}
