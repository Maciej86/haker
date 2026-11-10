import type { MissionDef } from '../engine/missions';
import type { MissionId } from '../engine/types';
import { kuba } from './kuba/mission';
import { w } from './w/mission';
import { m3 } from './m3/mission';

export const MISSION_ORDER: MissionId[] = ['kuba', 'w', 'm3'];
export const MAIL_ORDER: MissionId[] = ['w', 'm3', 'kuba'];
export const MISSIONS: Record<MissionId, MissionDef> = { kuba, w, m3 };
import './kuba/dev';
