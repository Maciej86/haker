// Rejestracje UI sesji na serwerze z folderami (plan 21): tryb przewodów Wytrycha, licznik namierzania, widok mc.
// Import w src/screens/desktop/Desktop.tsx (przed DeviceMeter: #trc stoi w pasku przed #dev, misja.html 441–442).
import { WYTRYCH_MODES } from '../wytrych/modes';
import { WiresPanel } from '../wytrych/WiresPanel';
import { registerSlot } from '../../screens/desktop/slots';
import { registerTerminalView } from '../terminal/views';
import { onServer } from '../../engine/server';
import { TraceMeter } from './TraceMeter';
import { McView } from './McView';
import './server.css';

WYTRYCH_MODES.wires = WiresPanel;
registerSlot('bar', 'trace', TraceMeter);
registerTerminalView({ id: 'mc', active: (s) => onServer(s) && (s.srv.mc.open || s.srv.editor !== null), component: McView });
