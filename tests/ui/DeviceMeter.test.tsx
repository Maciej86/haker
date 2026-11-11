// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it } from 'vitest';
import { TopBar } from '../../src/screens/desktop/TopBar';
import { StageCard } from '../../src/screens/desktop/StageCard';
import '../../src/screens/desktop/DeviceMeter';
import { acceptOffer } from '../../src/engine/missions';
import { afterKuba, atS1, inPack, linked } from '../engine/netHelpers';
import { renderWithStore } from './helpers';

afterEach(() => cleanup());
const meter = () => document.getElementById('dev');

it('licznik urządzenia tylko przy połączeniu z S1', () => {
  renderWithStore(<TopBar />, afterKuba([atS1(40)]));
  expect(meter()).toBeNull();
  cleanup();
  renderWithStore(<TopBar />, linked(afterKuba([atS1(40)])));
  expect(screen.getByText('PODSŁUCH-1 · S1')).toBeInTheDocument();
  expect(screen.getByText('40 min')).toBeInTheDocument();
  expect(meter()!.className).toBe('hb');
  expect((meter()!.querySelector('.meter i') as HTMLElement).style.width).toMatch(/^66\.66/);
});
it('klasa low przy 0 < zapas < 15, off przy 0', () => {
  renderWithStore(<TopBar />, linked(afterKuba([atS1(2)])));
  expect(meter()!.className).toBe('hb low');
  cleanup();
  renderWithStore(<TopBar />, linked(afterKuba([atS1(0)])));
  expect(meter()!.className).toBe('hb off');
});
it('karta Postęp zlecenia: podmiana żywego podsłuchu z nowym w plecaku', () => {
  renderWithStore(<StageCard />, acceptOffer(afterKuba([atS1(30), inPack()]), 'w').state);
  expect(screen.getByRole('button', { name: /^Jedź i podmień \(stary: 30 min\)/ })).toBeTruthy();
});
it('karta Postęp zlecenia: drugi wyjazd przy martwym podsłuchu i nowym w plecaku', async () => {
  const label = 'Jedź i podepnij · samochód ok. 1\u00a0h\u00a050\u00a0min, 58\u00a0¤';
  renderWithStore(<StageCard />, acceptOffer(afterKuba([atS1(0)]), 'w').state);
  expect(screen.queryByRole('button', { name: label })).toBeNull();
  cleanup();
  const s = acceptOffer(afterKuba([atS1(0), inPack()]), 'w').state;
  const { store } = renderWithStore(<StageCard />, s);
  await userEvent.click(screen.getByRole('button', { name: label }));
  expect(store.get().devices).toEqual([{ id: 'bug1', where: 'S1', minutes: 60 }]);
  expect(store.get().money).toBe(s.money - 58);
  expect(screen.queryByRole('button', { name: label })).toBeNull();
});
