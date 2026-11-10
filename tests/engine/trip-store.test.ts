import { test, expect, beforeEach, afterEach } from 'vitest';
import { createStore } from '../../src/engine/store';
import { SAVE_KEY, newGame, deserialize } from '../../src/engine/state';
import { planTrip, finishTrip, initTalk, talkAnswer, type TalkKind } from '../../src/engine/trip';
import { MISSIONS } from '../../src/missions';
import { SAMPLE_TRIP } from '../../src/world/trip/sample';

const orig = MISSIONS.w;
beforeEach(() => { (MISSIONS as any).w = { ...orig, trip: SAMPLE_TRIP }; });
afterEach(() => { (MISSIONS as any).w = orig; });
const mem = () => { const m = new Map<string,string>(); return { getItem: (k: string) => m.get(k) ?? null,
  setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k),
  clear: () => m.clear(), key: () => null, length: 0 } as Storage; };

test('wyjazd zapisuje się tylko na końcu', () => {
  const st = mem();
  const s0 = { ...newGame(7), done: ['kuba'], active: 'w', t: 848, money: 400, screen: 'mapCity' } as const;
  const store = createStore(s0 as any, { persist: st });
  store.apply({ ...s0, mapCityDistrict: 'centrum' } as any);
  const before = st.getItem(SAVE_KEY);
  store.apply(planTrip(store.get(), { place: 'centrum', building: 0, isTarget: true }));
  expect(store.get().screen).toBe('trip');
  expect(st.getItem(SAVE_KEY)).toBe(before);           // odświeżenie wróci na mapCity bez kosztów
  expect(deserialize(before)!.screen).toBe('mapCity');
  const talk = (['good', 'good'] as TalkKind[]).reduce(talkAnswer, initTalk());
  store.apply(finishTrip(store.get(), { transport: 'regio', talk }));
  expect(deserialize(st.getItem(SAVE_KEY))!).toMatchObject({ screen: 'desktop', money: 354 });
});

test('stary zapis z pustym trip: brakujące pola uzupełnione przy odczycie', () => {
  const o = JSON.parse(JSON.stringify(newGame(3)));
  o.trip = {};
  expect(deserialize(JSON.stringify(o))!.trip).toEqual({ mission: null, last: null, trips: 0, suspicious: false });
});
