import { test, expect } from 'vitest';
import { loadGeo } from '../../src/world/geo/load';
import { drawPoland } from '../../src/world/geo/render';
import { CITIES, cityCardRows, airportCard, AIRPORTS } from '../../src/world/geo/cities';
import { SAMPLE_TRIP } from '../../src/world/trip/sample';

test('pl.json: 13 krajów, 16 województw, rzeki', async () => {
  const g = await loadGeo();
  expect(Object.keys(g.countries)).toHaveLength(13);
  expect(g.voi).toHaveLength(16);
  expect(g.rivers.length).toBeGreaterThanOrEqual(5);
});
test('bez zlecenia mapa nie ma znacznika misji', async () => {
  const svg = drawPoland(await loadGeo(), { missionCity: null });
  expect(svg).not.toContain('◎');
  expect(svg).toContain('⌂ Nowy Tomyśl');
});
test('ze zleceniem Poznań ma ◎', async () => {
  expect(drawPoland(await loadGeo(), { missionCity: 'Poznań' })).toContain('Poznań ◎');
});
test('otwarte miasto bez mapy: niedostępne w demo', () => {
  const c = CITIES.find(c => c.n === 'Opalenica')!;
  expect(cityCardRows(c, null, 'czw').foot.text).toBe('▸ niedostępne w demo');
});
test('Poznań ze zleceniem: wiersz zlecenia z terminem', () => {
  const c = CITIES.find(c => c.n === 'Poznań')!;
  const rows = cityCardRows(c, SAMPLE_TRIP, 'czw').rows;
  expect(rows).toContainEqual(['zlecenie', SAMPLE_TRIP.mapText + ' Termin: czw 19:00', 't']);
  expect(rows).toContainEqual(['pociąg', 'ekspres 30 min (rozkład), 37 ¤', 'h']);
  expect(rows).toContainEqual(['pociąg', 'regionalny 46 min (rozkład), 23 ¤', 'h']);
});
test('lotnisko Poznań niedostępne w demo', () => {
  const a = AIRPORTS.find(a => a[3])!;
  expect(airportCard(a).rows).toContainEqual(['w grze', 'niedostępne w demo']);
});
