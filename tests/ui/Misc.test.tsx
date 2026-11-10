// @vitest-environment jsdom
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it } from 'vitest';
import { Achievements } from '../../src/apps/achievements/Achievements';
import { Notes } from '../../src/apps/notes/Notes';
import { Downloads } from '../../src/apps/downloads/Downloads';
import { APPS } from '../../src/apps/registry';
import { missionDef } from '../../src/engine/missions';
import { game, withMission } from '../engine/fixtures';
import { TermInputProbe, renderWithStore } from './helpers';

let restore = () => {};
afterEach(() => restore());

it('wpisy w APPS', () => {
  expect(APPS.achievements.component).toBe(Achievements);
  expect(APPS.notes.component).toBe(Notes);
  expect(APPS.downloads.component).toBe(Downloads);
});
it('Osiągnięcia', () => {
  renderWithStore(<Achievements />);
  const scans = screen.getByRole('heading', { name: 'Człowiek sieci' }).closest('.ach')!;
  expect(scans).toHaveTextContent('0/5'); expect(scans.querySelector('.bar')).not.toBeNull();
  expect(screen.getByRole('heading', { name: 'Mistrz terminala' }).closest('.ach')).toHaveClass('lock');
});
it('Notatki: przycisk wpisuje polecenie', async () => {
  restore = withMission('kuba', { notes: [{ id: 'ip', src: 'pon 18:40 · u Zenka w piekarni', html: 'Adres serwerka: <b>83.21.40.17</b>.', insert: 'connect 83.21.40.17' }] });
  renderWithStore(<><Notes /><TermInputProbe /></>);
  expect(screen.getByText('Twoje notatki. Czytanie nic nie kosztuje.')).toBeInTheDocument();
  expect(screen.getByText('pon 18:40 · u Zenka w piekarni')).toHaveClass('src');
  await userEvent.click(screen.getByRole('button', { name: 'Wpisz w Terminalu: connect 83.21.40.17 ›' }));
  expect(screen.getByTestId('input')).toHaveTextContent('connect 83.21.40.17');
});
it('Pobrane: pusto i z plikiem', () => {
  const { unmount } = renderWithStore(<Downloads />);
  expect(screen.getByText('Pusto. Pliki pobierasz w Terminalu poleceniem get.')).toBeInTheDocument(); unmount();
  renderWithStore(<Downloads />, game({ downloads: [{ name: 'playlista.txt', size: '4 KB', mission: 'kuba', host: '83.21.40.17', fileId: 'p' }] }));
  expect(screen.getByText('playlista.txt')).toBeInTheDocument();
  expect(screen.getByText(`83.21.40.17 · ${missionDef('kuba').title}`)).toBeInTheDocument();
});
