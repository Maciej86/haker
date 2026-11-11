import type { GameState, Location, StepResult } from './types';
import { step } from './types';
import { esc } from './text';
import { findHost, focusMission, missionDef } from './missions';
import { BASIC_COMMANDS } from './commands/basic';
import { DIRECT_COMMANDS } from './commands/direct';
import { FILE_COMMANDS } from './commands/files';
import { FIELD_COMMANDS } from './commands/field';
import { RECON_COMMANDS } from './commands/recon';
import { SERVER_COMMANDS } from './commands/server';

export type Command = (args: string[], s: GameState) => StepResult;
export type CommandTable = Record<string, Command>;

export const HISTORY_MAX = 200;

export function parseLine(line: string): { cmd: string; args: string[] } | null {
  const raw = line.trim();
  if (!raw) return null;
  const [cmd, ...args] = raw.split(/\s+/);
  return { cmd, args };
}

export function historyNav(
  history: string[],
  index: number,
  dir: 'up' | 'down',
): { index: number; value: string } {
  if (dir === 'up') {
    if (index > 0) return { index: index - 1, value: history[index - 1] ?? '' };
    return { index, value: history[0] ?? '' };
  }
  const next = Math.min(index + 1, history.length);
  return { index: next, value: history[next] ?? '' };
}

export function promptFor(s: GameState): string {
  const loc: Location = s.terminal.location;
  if (loc.kind === 'home') return '>';
  if (loc.kind === 'S1') return 'S1 >';
  return `${findHost(loc.ip)?.promptName ?? loc.ip}:${loc.path} >`;
}

export const BASE_COMMANDS: CommandTable = {
  ...BASIC_COMMANDS, ...DIRECT_COMMANDS, ...FILE_COMMANDS, ...FIELD_COMMANDS, ...RECON_COMMANDS, ...SERVER_COMMANDS,
};

/** Odpowiedź na nieznane polecenie. */
export function notFound(s: GameState, cmd: string): StepResult {
  return step(s, [{ html: `${esc(cmd)}: nie znaleziono polecenia. Wpisz help.` }]);
}

const own = (t: CommandTable | undefined, k: string): Command | undefined =>
  t && Object.hasOwn(t, k) ? t[k] : undefined;

export function runLine(s: GameState, line: string): StepResult {
  const raw = line.trim();
  const echo = `<span class="c">${esc(promptFor(s))}</span> ${esc(raw)}`;
  const withEcho: GameState = {
    ...s,
    terminal: { ...s.terminal, lines: [...s.terminal.lines, { html: echo }] },
  };
  const parsed = parseLine(raw);
  if (!parsed) return step(withEcho);
  const state: GameState = {
    ...withEcho,
    terminal: {
      ...withEcho.terminal,
      history: [...withEcho.terminal.history, raw].slice(-HISTORY_MAX),
    },
  };
  const m = focusMission(s);
  const command = own(m ? missionDef(m).commands : undefined, parsed.cmd) ?? own(BASE_COMMANDS, parsed.cmd);
  if (!command) return notFound(state, parsed.cmd);
  return command(parsed.args, state);
}
