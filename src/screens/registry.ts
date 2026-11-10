import { createElement, type FC } from 'react';
import type { Screen } from '../engine/types';
import { ScreenPlaceholder } from './ScreenPlaceholder';

const screens = new Map<Screen, FC>();

export function registerScreen(screen: Exclude<Screen, 'desktop'>, c: FC): void {
  screens.set(screen, c);
}

export function screenComponent(screen: Screen): FC {
  return screens.get(screen) ?? (() => createElement(ScreenPlaceholder, { screen }));
}
