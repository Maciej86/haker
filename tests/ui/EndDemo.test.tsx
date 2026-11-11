// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { endView } from '../../src/screens/overlays/endView';
import { Summary } from '../../src/screens/overlays/Summary';
import { End } from '../../src/screens/overlays/End';
import { bug } from '../../src/engine/devices';
import { renderWithStore } from './helpers';
import { cleanBack, report } from '../missions/m3/helpers';

const fin = () => report({ ...cleanBack(), done: ['kuba', 'w'] }).state;
test('endView po trzech zleceniach', () => {
  const f = fin(); const v = endView(f);
  expect(v.done).toEqual(['✓ Playlista z imprezy (Kuba)', '✓ Zestawienie oddziałów (W.)', '✓ Spacer o 21:14 (L.)']);
  expect(v).toMatchObject({ log: ['> Koniec demo.', '> Dziękujemy za grę.'], header: 'Ukończone zlecenia · czw 21:52', xp: `${f.xp} XP` });
  expect(v.bug).toBe(`PODSŁUCH-1 przy S1: zostało ${bug(f)!.minutes} min`);
});
test('Koniec demo ›, potem Zagraj od nowa: nowa gra z misją Kuby', () => {
  const { store } = renderWithStore(<><Summary /><End /></>, fin());
  fireEvent.click(screen.getByRole('button', { name: 'Koniec demo ›' }));
  expect(store.get().overlay).toBe('end');
  expect(screen.getByText('✓ Spacer o 21:14 (L.)')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Zagraj od nowa' }));
  expect(store.get()).toMatchObject({ done: [], active: null, day: 'śr', t: 1230, money: 100, overlay: null });
});
