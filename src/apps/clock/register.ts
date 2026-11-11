// Rejestracje UI misji czasowej (plan 31): duży zegar, aplikacja Zegar i pokaz przejścia na planie piętra.
// Import w src/screens/desktop/Desktop.tsx, obok rejestracji planu 21.
import { registerApp } from '../registry';
import { registerSlot } from '../../screens/desktop/slots';
import { BigClock, ClockApp } from './BigClock';
import { PlanWalkListener, WalkingFloorPlan } from '../plan/WalkingFloorPlan';

registerSlot('desktop', 'bigclock', BigClock);
registerApp('clock', { component: ClockApp });

// Pokaz przejścia na planie piętra: słuchacz zdarzenia `walk` i okno planu z kropką (zastępuje FloorPlanApp).
registerSlot('desktop', 'plan-walk', PlanWalkListener);
registerApp('plan', { component: WalkingFloorPlan });
