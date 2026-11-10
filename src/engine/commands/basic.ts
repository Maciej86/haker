import type { CommandTable } from '../terminal';
import { step } from '../types';

export const BASIC_COMMANDS: CommandTable = {
  whoami: (_a, s) => step(s, [{ html: 'ghost' }]),
};
