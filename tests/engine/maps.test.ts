import { test, expect } from 'vitest';
import { openCity, openDistrict, toPoland, toDesktop } from '../../src/engine/maps';
import { newGame } from '../../src/engine/state';
const s = { ...newGame(1), t: 900, money: 400 };
test('przejścia map nie kosztują czasu ani pieniędzy', () => {
  expect(openCity(s, 'leszno')).toMatchObject({ screen: 'mapCity', mapCityTab: 'leszno', mapCityDistrict: null, t: 900, money: 400 });
  expect(openDistrict(s, 'centrum')).toMatchObject({ mapCityTab: 'poznan', mapCityDistrict: 'centrum' });
  expect(toPoland(s).screen).toBe('mapPoland');
  expect(toDesktop(s).screen).toBe('desktop');
});

import { devJumps } from '../../src/engine/dev';
import { MISSIONS } from '../../src/missions';
import { SAMPLE_TRIP } from '../../src/world/trip/sample';
test('skoki deweloperskie map: bez zlecenia i wyjazd próbny', () => {
  const j = (id: string) => devJumps().find((x) => x.id === id)!;
  expect(j('maps-free').label).toBe('Po Kubie, bez zlecenia (czw 13:50)');
  expect(j('maps-free').make()).toMatchObject({ done: ['kuba'], day: 'czw', t: 830, money: 400, screen: 'mapPoland', active: null });
  const orig = MISSIONS.w.trip;
  expect(j('trip-sample').make()).toMatchObject({ active: 'w', t: 848, screen: 'mapCity', mapCityTab: 'poznan', mapCityDistrict: 'centrum' });
  expect(MISSIONS.w.trip).toBe(orig ?? SAMPLE_TRIP);
  if (!orig) delete MISSIONS.w.trip;
});
