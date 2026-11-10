import type { AppId, GameState, Line, MailMsg, MissionId, StepResult, SummaryRow, UiEvent } from './types';
import { step } from './types';
import { advance, dayVars, gclk } from './clock';
import { esc, fill, fmt } from './text';
import type { CommandTable } from './terminal';
import type { HelpGroup } from './help';
import type { RealtimeSource } from './realtime';
import { MISSIONS, MAIL_ORDER, MISSION_ORDER } from '../missions';
import { addXp, skillSummaryRows } from './skills';
import { THEME_UNLOCKS, unlockedThemes } from './profile';
import { newGame } from './state';

export type NoteCard = { id: string; src: string; html: string; insert?: string; when?: (s: GameState) => boolean };
export type HostDef = {
  ip: string;
  name: string;
  promptName?: string;
  access: 'direct' | 'S1';
  usageHint?: string;                              // dopisek do „Użycie: connect <ip>.”
  cracked: (s: GameState) => boolean;
  onConnectLocked: (s: GameState) => StepResult;   // connect bez znanego hasła (1 min już naliczona)
  onCrack: (s: GameState) => StepResult;           // crack na tym hoście (koszt nalicza misja)
};
export type NetworkOverlay = { nodes: { ip: string }[] };
export type TripDef = { packageFrom: string };
export type DeliveryDef = { kind: 'file' | 'report' };
export type BonusDef = { label: string; money: number; when: (s: GameState) => boolean; note?: string };
export type StageDef = { title: string; sub: string; coach: string };

export type MissionDef = {
  id: MissionId;
  title: string;
  giver: { id: string; name: string; dative?: string }; // dative: „Odpowiedz Kubie”
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
  /** Pokazywany, gdy gracz próbuje podróżować w tej misji, a ta nie ma `trip`. */
  noTripText?: string;
  appBadges?: (s: GameState) => (AppId | 'map')[];
  termLabel?: string;
  termStep?: (s: GameState) => string;
  notesTitle?: string;
  notesIntro?: string;
  notesFooter?: string;
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

/** Host o tym IP z hostów misji w fokusie (w odróżnieniu od `findHost`, który szuka we wszystkich). */
export function missionHost(s: GameState, ip: string): HostDef | undefined {
  const id = focusMission(s);
  return id ? missionDef(id).hosts?.find((h) => h.ip === ip) : undefined;
}

export function visibleOffers(s: GameState): MissionId[] {
  return MAIL_ORDER.filter(
    (id) =>
      !s.mail.hidden.includes(id) &&
      missionDef(id).availability.afterMissions.every((m) => s.done.includes(m)),
  );
}

export function focusMission(s: GameState): MissionId | null {
  if (s.active) return s.active;
  const free = visibleOffers(s).filter((id) => !s.done.includes(id));
  return free.length === 1 ? free[0] : null;
}

export function isBlocked(s: GameState, id: MissionId): boolean {
  return s.active !== null && s.active !== id && !s.done.includes(id);
}

export const BUSY_NOTE = {
  button: 'Zablokowane',
  title: 'Najpierw skończ bieżące zlecenie.',
  body: 'Ta oferta poczeka. W demo nie da się prowadzić dwóch zleceń naraz.',
};

export function acceptOffer(s: GameState, id: MissionId): StepResult {
  if (
    !visibleOffers(s).includes(id) ||
    isBlocked(s, id) ||
    s.active === id ||
    s.done.includes(id)
  ) {
    return step(s);
  }
  const def = missionDef(id);
  const { offer, giver } = def;
  const reply = s.mail.draft[id] ?? offer.acceptReply;

  let cur = advance(s, offer.acceptCost);
  const mine: MailMsg = { from: 'Ty', when: gclk(cur), html: esc(reply) };
  cur = advance(cur, offer.giverAnswer.cost);
  const theirs: MailMsg = {
    from: giver.name,
    when: gclk(cur),
    html: fill(offer.giverAnswer.text, dayVars(s)),
  };
  const { [id]: _draft, ...draft } = cur.mail.draft;
  cur = {
    ...cur,
    active: id,
    gains: [],
    mail: {
      ...cur.mail,
      read: cur.mail.read.includes(id) ? cur.mail.read : [...cur.mail.read, id],
      threads: { ...cur.mail.threads, [id]: [...(cur.mail.threads[id] ?? []), mine, theirs] },
      draft,
    },
  };

  const lines: Line[] = [];
  const ui: UiEvent[] = [
    { kind: 'mailArrives', thread: id, msg: theirs, delayMs: offer.giverAnswer.delayMs },
  ];
  if (def.onAccept) {
    const r = def.onAccept(cur);
    cur = r.state;
    lines.push(...r.lines);
    ui.push(...r.ui);
  }
  return step(cur, lines, ui);
}

export function stageIndex(s: GameState): number {
  const id = focusMission(s);
  return id ? missionDef(id).stageIndex(s) : -1;
}

export function coachLine(s: GameState): string | null {
  const id = focusMission(s);
  return id ? (missionDef(id).stages[stageIndex(s)]?.coach ?? null) : null;
}

export type StageViewRow = {
  title: string;
  sub: string;
  mark: string;
  state: 'done' | 'now' | 'todo';
  coach: string | null;
};

export function stageView(s: GameState): StageViewRow[] {
  const id = focusMission(s);
  if (!id) return [];
  const def = missionDef(id);
  const cur = def.stageIndex(s);
  return def.stages.map((st, i) => {
    const state = i < cur ? 'done' : i === cur ? 'now' : 'todo';
    return {
      title: st.title,
      sub: def.stageSub?.(s, i) ?? st.sub,
      mark: state === 'done' ? '✓' : state === 'now' ? '▶' : `${i + 1}.`,
      state,
      coach: state === 'now' ? st.coach : null,
    };
  });
}

export function finishMission(s: GameState, id: MissionId): StepResult {
  const def = missionDef(id);
  const r0 = def.onFinish?.(s) ?? step(s);
  const st = r0.state;
  const base = def.adjustReward?.(st) ?? { money: def.rewards.money, label: 'Nagroda za zlecenie' };
  const bonuses = def.bonuses.map((b) => ({ b, ok: b.when(st) }));
  const bonusMoney = bonuses.reduce((sum, x) => sum + (x.ok ? x.b.money : 0), 0);
  const total = base.money + bonusMoney;

  const done = st.done.includes(id) ? st.done : [...st.done, id];
  const next: GameState = {
    ...addXp(st, def.rewards.xp),
    money: st.money + total,
    done,
    active: null,
    failed: false,
    overlay: 'summary',
  };

  const rows: SummaryRow[] = [{ label: base.label, value: `${fmt(base.money)} ¤`, tone: 'ok' }];
  for (const { b, ok } of bonuses) {
    if (ok) {
      rows.push({ label: '✓ ' + b.label, value: b.money ? `+${fmt(b.money)} ¤` : (b.note ?? ''), tone: 'ok' });
    } else {
      rows.push({ label: '· ' + b.label, value: b.money ? '—' : (b.note ?? '') });
    }
  }
  const before = unlockedThemes(st.done.length);
  for (const themeId of unlockedThemes(done.length)) {
    if (before.includes(themeId)) continue;
    const name = THEME_UNLOCKS.find((t) => t.id === themeId)?.name ?? themeId;
    rows.push({ label: `Odblokowano: motyw ${name} (Start → Motyw)`, value: '', tone: 'ok' });
  }
  rows.push(...def.summary(next), ...skillSummaryRows(next));

  const withSummary: GameState = {
    ...next,
    summary: rows,
    summaryMeta: {
      log: def.doneLog,
      xp: def.rewards.xp,
      money: total,
      next: MISSION_ORDER.every((m) => done.includes(m)) ? 'end' : 'nextDay',
    },
  };
  return step(withSummary, r0.lines, r0.ui);
}

export function failMission(s: GameState): StepResult {
  const def = missionDef(s.active);
  return step({
    ...s,
    failed: true,
    overlay: 'summary',
    summary: skillSummaryRows(s),
    summaryMeta: { log: def?.failLog ?? ['> Zlecenie nieudane.'], xp: 0, money: 0, next: 'retry' },
  });
}

export function retryDay(s: GameState): GameState {
  const cp = s.dayCheckpoint;
  if (cp) return { ...structuredClone(cp), dayCheckpoint: structuredClone(cp) };
  return newGame(s.seed);
}


export function appBadges(s: GameState): (AppId | 'map')[] {
  return missionDef(focusMission(s))?.appBadges?.(s) ?? [];
}

export function termStep(s: GameState): string | null {
  return missionDef(focusMission(s))?.termStep?.(s) ?? null;
}
