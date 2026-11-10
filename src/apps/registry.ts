import type { FC } from 'react';
import type { AppId, GameState } from '../engine/types';
import { appBadge, notesView } from '../engine/desktop';
import { focusMission, missionDef } from '../engine/missions';
import { place, type Rect, type WinState } from '../ui/windows';
import { HelpApp } from './help/HelpApp';
import { ICONS } from './icons';
import { Placeholder } from './Placeholder';

export type AppEntry = {
  title: string;
  icon: string;
  component: FC;
  desktop: (s: GameState) => boolean;
  winTitle?: (s: GameState) => string;
  rect: (vw: number, vh: number) => Rect;
  placeNext?: boolean;
  tone?: 'red';
  badge?: (s: GameState) => string | null;
};

const always = () => true;
const never = () => false;
const R = (x: number, y: number, w: number, h: number) => () => ({ x, y, w, h });

function entry(id: AppId, e: Omit<AppEntry, 'icon' | 'badge' | 'component'> & { component?: FC }): AppEntry {
  return { component: Placeholder, icon: ICONS[id], badge: (s) => appBadge(s, id), ...e };
}

export const APPS: Record<AppId, AppEntry> = {
  terminal: entry('terminal', { title: 'Terminal', winTitle: () => 'ghost@neonos: ~ · Nowy Tomyśl', rect: R(220, 64, 680, 440), desktop: always }),
  mail: entry('mail', { title: 'Poczta', winTitle: () => 'Poczta: ghost@neonmail.net', rect: (vw) => ({ x: Math.max(0, vw - 1120), y: 80, w: 760, h: 540 }), desktop: always }),
  browser: entry('browser', { title: 'Przeglądarka', winTitle: () => 'Przeglądarka', rect: R(200, 96, 720, 480), desktop: always }),
  darknet: entry('darknet', { title: 'Darknet', winTitle: () => 'Darknet: Czarny Rynek', rect: R(260, 130, 700, 460), desktop: always, tone: 'red' }),
  netmap: entry('netmap', { title: 'NetMap', winTitle: () => 'NetMap', rect: (vw, vh) => ({ x: 200, y: 58, w: Math.max(760, Math.min(1000, vw - 480)), h: vh - 110 }), desktop: always, placeNext: true }),
  wytrych: entry('wytrych', { title: 'Wytrych', winTitle: () => 'Wytrych 1.0', rect: R(220, 70, 820, 560), desktop: (s) => s.owned.includes('wyt'), placeNext: true }),
  help: entry('help', { title: 'Ściąga', winTitle: () => 'Ściąga · polecenia i programy', rect: R(330, 90, 680, 520), desktop: always, component: HelpApp }),
  notes: entry('notes', { title: 'Notatki', winTitle: (s) => notesView(s).title, rect: R(300, 150, 440, 380), desktop: always }),
  achievements: entry('achievements', { title: 'Osiągnięcia', winTitle: () => 'Osiągnięcia', rect: R(380, 100, 520, 440), desktop: always }),
  // [decyzja Claude'a] w makiecie nie ma tej ikony; pokazuje się po pierwszym pobraniu
  downloads: entry('downloads', { title: 'Pobrane', winTitle: () => 'Pobrane', rect: R(340, 170, 440, 320), desktop: (s) => s.downloads.length > 0 }),
  plan: entry('plan', { title: 'Plan piętra', winTitle: () => 'Plan piętra · Hotel Luksus, p. 7', rect: (vw) => ({ x: 230, y: 70, w: Math.min(820, vw - 300), h: 440 }), desktop: never, placeNext: true }),
  clock: entry('clock', { title: 'Zegar', winTitle: () => 'Zegar', rect: R(0, 0, 320, 180), desktop: never }),
};

export function registerApp(id: AppId, patch: Partial<AppEntry>): void {
  APPS[id] = { ...APPS[id], ...patch };
}

export const DESKTOP_ORDER: (AppId | 'map')[] = ['terminal', 'mail', 'browser', 'darknet', 'map', 'plan', 'netmap', 'wytrych', 'help', 'notes', 'achievements', 'downloads', 'clock'];
export const MAP_ICON = { title: 'Mapa', icon: ICONS.map };

export function visibleIcons(s: GameState): (AppId | 'map')[] {
  const extra = missionDef(focusMission(s))?.apps ?? [];
  return DESKTOP_ORDER.filter((id) => id === 'map' || APPS[id].desktop(s) || extra.includes(id));
}

export function rectFor(app: AppId, ws: WinState): Rect {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const a = APPS[app];
  if (a.placeNext && !ws.placed.includes(app)) {
    const term = ws.order.includes('terminal') ? ws.rects.terminal ?? null : null;
    return place(term, vw, vh) ?? a.rect(vw, vh);
  }
  return a.rect(vw, vh);
}
