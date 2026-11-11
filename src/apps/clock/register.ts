// Rejestracje UI misji czasowej (plan 31): duży zegar na pulpicie i aplikacja Zegar.
// Import w src/screens/desktop/Desktop.tsx, obok rejestracji planu 21.
import { registerApp } from '../registry';
import { registerSlot } from '../../screens/desktop/slots';
import { BigClock, ClockApp } from './BigClock';

registerSlot('desktop', 'bigclock', BigClock);
registerApp('clock', { component: ClockApp });
