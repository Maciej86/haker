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

import MapCity from '../../src/screens/map-city/MapCity';
test('mapa miasta: najechanie na budynek dodaje .hov i kartę, na dzielnicę .dist.hov', async () => {
  const { container } = renderWithStore(<MapCity />, { ...free(), screen: 'mapCity', mapCityTab: 'nt' });
  await waitFor(() => expect(container.querySelector('svg.map .b[data-i]')).toBeTruthy());
  const b = container.querySelector('svg.map .b[data-i]')!;
  fireEvent.pointerMove(b.querySelector('polygon')!);
  expect(b.classList.contains('hov')).toBe(true);
  expect(container.querySelector('.mc-info')).toBeTruthy();
  fireEvent.pointerMove(container.querySelector('svg.map')!);
  expect(b.classList.contains('hov')).toBe(false);
});
test('mapa miasta: Poznań, najechanie na .dist dodaje hov (fallback bez współrzędnych)', async () => {
  const { container } = renderWithStore(<MapCity />, { ...free(), screen: 'mapCity', mapCityTab: 'poznan' });
  await waitFor(() => expect(container.querySelector('.dist[data-d="wilda"]')).toBeTruthy());
  const d = container.querySelector('.dist[data-d="wilda"]')!;
  fireEvent.pointerMove(d.querySelector('polygon')!);
  expect(d.classList.contains('hov')).toBe(true);
  expect(screen.getByText('▸ kliknij, żeby wejść do dzielnicy')).toBeTruthy();
});
test('mapa miasta: hover działa mimo kolorów w style (!important)', () => {
  const css = readFileSync('src/screens/map-city/MapCity.css', 'utf8');
  expect(css).toMatch(/\.dist\.hov polygon\{fill:var\(--map-dist-hover\)!important\}/);
  expect(css).toMatch(/\.b\.hov polygon\{stroke:var\(--text\)!important\}/);
});
