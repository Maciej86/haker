import { registerDevJump } from '../../engine/dev';
import { newGame } from '../../engine/state';

registerDevJump({ id: 'kuba', label: 'misja 1 (Kuba)', make: () => newGame() });
