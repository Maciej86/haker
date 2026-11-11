// Rejestracje UI sesji na serwerze z folderami (plan 21): tryb przewodów Wytrycha, licznik namierzania, widok mc.
// Import w src/screens/desktop/Desktop.tsx (przed DeviceMeter: #trc stoi w pasku przed #dev, misja.html 441–442).
import { WYTRYCH_MODES } from '../wytrych/modes';
import { WiresPanel } from '../wytrych/WiresPanel';
import { registerSlot } from '../../screens/desktop/slots';
import { TraceMeter } from './TraceMeter';
import './server.css';

WYTRYCH_MODES.wires = WiresPanel;
registerSlot('bar', 'trace', TraceMeter);
