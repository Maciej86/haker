import type { AppId, GameState, MissionId, StepResult, SummaryRow } from './types';
import type { CommandTable } from './terminal';
import type { HelpGroup } from './help';
import type { RealtimeSource } from './realtime';
import { MISSIONS, MISSION_ORDER } from '../missions';

export type NoteCard = { id: string; src: string; html: string; insert?: string };
export type HostDef = { ip: string; name: string; promptName?: string };
export type NetworkOverlay = { nodes: { ip: string }[] };
export type TripDef = { packageFrom: string };
export type DeliveryDef = { kind: 'file' | 'report' };
export type BonusDef = { label: string; money: number; when: (s: GameState) => boolean; note?: string };
export type StageDef = { title: string; sub: string; coach: string };

export type MissionDef = {
  id: MissionId;
  title: string;
  giver: { id: string; name: string };
  barName: string;
  availability: { afterMissions: MissionId[]; offerGroup?: string };
  offer: {
    subject: string;
    when: string;
    reward: number;
    levelLabel: string;
    body: string[];
    acceptReply: string;
    acceptCost: number;
    giverAnswer: { delayMs: number; cost: number; text: string; toast?: string };
  };
  deadline?: { time: number };
  introLine: string;
  notes: NoteCard[];
  stages: StageDef[];
  stageIndex: (s: GameState) => number;
  stageSub?: (s: GameState, i: number) => string | null;
  hosts?: HostDef[];
  network?: NetworkOverlay;
  commands?: CommandTable;
  help: HelpGroup[];
  helpReplacesBase?: boolean;
  hidePrograms?: string[];
  trip?: TripDef;
  delivery: DeliveryDef;
  rewards: { money: number; xp: number; unlock?: string[] };
  bonuses: BonusDef[];
  summary: (s: GameState) => SummaryRow[];
  doneLog: string[];
  failLog?: string[];
  hints?: { price: number; text: string }[];
  onAccept?: (s: GameState) => StepResult;
  onBuy?: (s: GameState, itemId: string) => StepResult;
  onTripDone?: (s: GameState) => StepResult;
  onFinish?: (s: GameState) => StepResult;
  onDeadline?: (s: GameState) => StepResult;
  interrupt?: (s: GameState) => GameState | null;
  adjustReward?: (s: GameState) => { money: number; label: string } | null;
  realtime?: RealtimeSource[];
  apps?: AppId[];
  deviceDeadText?: string;
};

export function missionDef(id: MissionId): MissionDef;
export function missionDef(id: MissionId | null | undefined): MissionDef | undefined;
export function missionDef(id: MissionId | null | undefined): MissionDef | undefined {
  return id ? MISSIONS[id] : undefined;
}

export function findHost(ip: string): HostDef | undefined {
  for (const m of Object.values(MISSIONS)) {
    const h = m.hosts?.find((x) => x.ip === ip);
    if (h) return h;
  }
  return undefined;
}

export function focusMission(s: GameState): MissionId | null {
  if (s.active) return s.active;
  return s.done.length === 0 ? MISSION_ORDER[0] : null;
}
