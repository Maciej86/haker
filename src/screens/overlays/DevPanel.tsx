import { devEnabled, devJumps } from '../../engine/dev';
import { useStore } from '../../ui/useGame';
import { useProfile } from '../../ui/useProfile';
import { useWindows } from '../../ui/windows';
import './Overlay.css';

// Skoki do etapów tylko pod ?dev=1 (misja.html linia 592: pasek „MAKIETA:”)
export function DevPanel() {
  const store = useStore();
  const windows = useWindows();
  const { setPreviewAll } = useProfile();
  if (!devEnabled(typeof location === 'undefined' ? '' : location.search)) return null;
  return (
    <span id="mk">
      DEV:
      {devJumps().map((j) => (
        <button key={j.id} onClick={() => { store.apply(j.make()); windows.reset(['terminal', 'mail']); }}>{j.label}</button>
      ))}
      <button onClick={() => setPreviewAll(true)}>odblokuj motywy</button>
    </span>
  );
}
