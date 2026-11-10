// @vitest-environment jsdom
import { test, expect } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import MapPoland from '../../src/screens/map-poland/MapPoland';
import { newGame } from '../../src/engine/state';
import { renderWithStore } from './helpers';

const free = () => ({ ...newGame(1), done: ['kuba' as const], day: 'czw' as const, t: 830, money: 400, screen: 'mapPoland' as const });

test('mapa Polski: najechanie podświetla miasto klasą hov i pokazuje kartę', async () => {
  const { container } = renderWithStore(<MapPoland />, free());
  expect(screen.getByText('brak przyjętego zlecenia')).toBeTruthy();
  await waitFor(() => expect(container.querySelector('.city[data-i]')).toBeTruthy());
  const poz = [...container.querySelectorAll('.city[data-i]')].find((e) => e.textContent?.includes('Poznań'))!;
  fireEvent.pointerMove(poz.querySelector('.dot')!);
  expect(poz.classList.contains('hov')).toBe(true);
  expect(screen.getByText('▸ kliknij, żeby wejść na mapę miasta')).toBeTruthy();
});
test('mapa Polski: hover kropki działa mimo kolorów w style (!important)', () => {
  const css = readFileSync('src/screens/map-poland/MapPoland.css', 'utf8');
  expect(css).toMatch(/\.city\.hov \.dot\{[^}]*stroke:var\(--geo-dot-hover\)!important/);
});
