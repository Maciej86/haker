import { BUG_MAX } from '../../engine/devices';
import { isLinkedToS1 } from '../../engine/commands/basic';
import { useGame } from '../../ui/useGame';
import { registerSlot } from './slots';
import './DeviceMeter.css';

// misja.html linia 442 (#dev), CSS linie 58–66, logika 669–671: licznik tylko przy połączeniu z S1.
export function DeviceMeter() {
  const linked = useGame(isLinkedToS1);
  const min = useGame((s) => s.devices.find((d) => d.id === 'bug1' && d.where === 'S1')?.minutes ?? 0);
  if (!linked) return null;
  const cls = min === 0 ? 'hb off' : min < 15 ? 'hb low' : 'hb';
  return (
    <span className={cls} id="dev" title="Pozostały czas pracy urządzenia. Maleje tylko, gdy urządzenie pracuje.">
      <span className="led" />
      <span>PODSŁUCH-1 · S1</span>
      <span className="meter"><i style={{ width: `${(min / BUG_MAX) * 100}%` }} /></span>
      <b id="devmin">{min} min</b>
    </span>
  );
}

registerSlot('bar', 'device', DeviceMeter);
