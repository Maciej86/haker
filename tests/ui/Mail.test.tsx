// @vitest-environment jsdom
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { Mail } from '../../src/apps/mail/Mail';
import { APPS } from '../../src/apps/registry';
import { acceptOffer, missionDef } from '../../src/engine/missions';
import { fmt } from '../../src/engine/text';
import { game } from '../engine/fixtures';
import { day2 } from '../helpers/states';
import { Probe, renderWithStore } from './helpers';

it('wpis w APPS', () => { expect(APPS.mail.component).toBe(Mail); });
it('nieprzeczytana oferta i treść po kliknięciu', async () => {
  const { store } = renderWithStore(<Mail />); const d = missionDef('kuba');
  const item = screen.getByRole('button', { name: new RegExp(d.offer.subject) }); expect(item).toHaveClass('unread');
  expect(store.get().mail.read).not.toContain('kuba');
  await userEvent.click(item);
  expect(store.get().mail.read).toContain('kuba');
  expect(item).toHaveAttribute('aria-current', 'true');
  expect(screen.getByRole('heading', { name: d.offer.subject })).toBeInTheDocument();
  expect(screen.getByText(fmt(d.offer.reward))).toBeInTheDocument();
  expect(screen.getByText(`${d.giver.name}, ${d.offer.when}`)).toBeInTheDocument();
  expect(screen.getByText('odpowiedz, żeby przyjąć')).toBeInTheDocument();
});
it('gotowa odpowiedź przyjmuje zlecenie', async () => {
  const { store } = renderWithStore(<Mail />); const d = missionDef('kuba');
  expect(screen.getByText(`Odpowiedz ${d.giver.name}`)).toBeInTheDocument();
  expect(screen.getByRole('textbox')).toHaveValue(d.offer.acceptReply);
  expect(screen.getByText(`${d.offer.acceptCost} min gry`)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Wyślij i przyjmij zlecenie' }));
  expect(store.get().active).toBe('kuba'); expect(screen.getByRole('button', { name: 'Przyjęte' })).toBeDisabled();
  expect(screen.queryByRole('textbox')).toBeNull();
});
it('tekst gracza w wątku jako tekst', async () => {
  renderWithStore(<Mail />); const ta = screen.getByRole('textbox');
  await userEvent.clear(ta); await userEvent.type(ta, '<b>gruby</b>');
  await userEvent.click(screen.getByRole('button', { name: 'Wyślij i przyjmij zlecenie' }));
  expect(screen.getByText('<b>gruby</b>', { exact: false })).toBeInTheDocument();
  expect(document.querySelector('.inbox b b')).toBeNull();
});
it('szkic w stanie', async () => {
  const { store } = renderWithStore(<Mail />); await userEvent.type(screen.getByRole('textbox'), '!');
  expect(store.get().mail.draft.kuba).toBe(missionDef('kuba').offer.acceptReply + '!');
});
it('zablokowana oferta', async () => {
  renderWithStore(<Mail />, { ...day2(), active: 'w' });
  await userEvent.click(screen.getByRole('button', { name: new RegExp(missionDef('m3').offer.subject) }));
  expect(screen.getByRole('button', { name: 'Zablokowane' })).toBeDisabled();
  expect(screen.getByText('Najpierw skończ bieżące zlecenie.')).toBeInTheDocument();
  expect(screen.getByText('Ta oferta poczeka. W demo nie da się prowadzić dwóch zleceń naraz.')).toBeInTheDocument();
  expect(screen.queryByRole('textbox')).toBeNull();
});
it('zakończone zlecenie', async () => {
  renderWithStore(<Mail />, day2());
  await userEvent.click(screen.getByRole('button', { name: new RegExp(missionDef('kuba').offer.subject) }));
  expect(screen.getByRole('button', { name: 'Zakończone' })).toBeDisabled();
});
it('odpowiedź zleceniodawcy ukryta do upływu delayMs, także po zamknięciu Poczty', () => {
  vi.useFakeTimers();
  const r = acceptOffer(game(), 'kuba'); const answer = r.state.mail.threads.kuba.at(-1)!;
  const { store, unmount } = renderWithStore(<><Probe /><Mail /></>);
  act(() => store.apply(r));
  expect(screen.queryByText(answer.when)).toBeNull();
  unmount();
  act(() => vi.advanceTimersByTime(missionDef('kuba').offer.giverAnswer.delayMs));
  renderWithStore(<Mail />, store.get());
  expect(screen.getAllByText(answer.when).length).toBeGreaterThan(0);
});
