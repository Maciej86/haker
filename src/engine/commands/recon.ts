import type { CommandTable } from '../terminal';
import { probe, route, scan } from '../network';

export const RECON_COMMANDS: CommandTable = {
  scan: (a, s) => scan(s, a),
  probe: (a, s) => probe(s, a[0]),
  route: (a, s) => route(s, a),
};
