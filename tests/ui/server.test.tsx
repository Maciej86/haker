// @vitest-environment jsdom
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import '../../src/apps/server/register';
import { Wytrych } from '../../src/apps/wytrych/Wytrych';
import { WYTRYCH_MODES } from '../../src/apps/wytrych/modes';
import { WiresPanel } from '../../src/apps/wytrych/WiresPanel';
import { Terminal } from '../../src/apps/terminal/Terminal';
import { slots } from '../../src/screens/desktop/slots';
import { TraceMeter } from '../../src/apps/server/TraceMeter';
import { endCrack, withSrv } from '../../src/engine/server';
import { runLine } from '../../src/engine/terminal';
import { realtimeTick } from '../../src/engine/realtime';
import { cracking, onBank } from '../missions/w/helpers';
import { Probe, renderWithStore } from './helpers';

const user = userEvent.setup();
const Bar = () => <>{slots('bar').map(x => <x.c key={x.id} />)}</>;

it('rejestracje: tryb przewodów i licznik w pasku', () => {
  expect(WYTRYCH_MODES.wires).toBe(WiresPanel);
  expect(slots('bar').find(x => x.id === 'trace')?.c).toBe(TraceMeter);
});
it('przewody: klik obraca, panel pokazuje obroty, abort wpisuje polecenie', async () => {
  const { store, container } = renderWithStore(<><Probe /><Wytrych /><Terminal /></>, cracking());
  expect(screen.getByText('Zadanie')).toBeInTheDocument();
  expect(container.querySelector('.wyt-wires')).not.toBeNull();
  expect(container.querySelectorAll('.wyt-wires button.cell')).toHaveLength(35);
  expect(screen.getByText('S1 ━')).toBeInTheDocument();
  expect(screen.getByText('━ ◆ .12')).toBeInTheDocument();
  await user.click(screen.getAllByTitle('klik: obróć w prawo · prawy klik: w lewo')[0]);
  expect(store.get().srv.crack!.moves).toBe(1);
  expect(screen.getByText(/obroty: 1/)).toBeInTheDocument();
  await user.pointer({ keys: '[MouseRight]', target: screen.getAllByTitle('klik: obróć w prawo · prawy klik: w lewo')[1] });
  expect(store.get().srv.crack!.moves).toBe(2);
  expect(screen.getByText(/rośnie samo \(~0\.7%\/s na 2 Mb\/s\) i o 1% za każdy obrót/)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Przerwij (abort) ›' }));
  expect(screen.getByLabelText('Polecenie')).toHaveValue('abort');
});
it('karta wyniku po udanej próbie: plansza zostaje, mc', async () => {
  const { store, container } = renderWithStore(<><Probe /><Wytrych /></>, cracking());
  await user.click(screen.getAllByTitle('klik: obróć w prawo · prawy klik: w lewo')[0]);
  act(() => store.apply(endCrack(store.get(), 'ok')));
  expect(screen.getByText('Dostęp uzyskany')).toBeInTheDocument();
  expect(container.querySelector('.wyt-wires .board.won')).not.toBeNull();
  expect(container.querySelectorAll('.wyt-wires button.cell svg path').length).toBeGreaterThan(0);
  expect(screen.getByText(/obroty: 1/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Przerwij (abort) ›' })).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Otwórz pliki (mc) ›' }));
  expect(screen.getByTestId('input')).toHaveTextContent('mc');
});
it('karta wyniku bez wcześniejszej planszy: namierzony, spróbuj ponownie', async () => {
  const s = endCrack(withSrv(cracking(), { trace: 100 }), 'caught').state;
  renderWithStore(<><Probe /><Wytrych /></>, s);
  expect(screen.getByText('Namierzono cię. Połączenie zerwane.')).toBeInTheDocument();
  expect(screen.getByText(/bank czujny po poprzedniej próbie: \+25%/)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Spróbuj ponownie ›' }));
  expect(screen.getByTestId('input')).toHaveTextContent('crack 10.42.7.12');
});
it('przerwana próba: karta Przerwano', () => {
  renderWithStore(<Wytrych />, runLine(cracking(), 'abort').state);
  expect(screen.getByText('Przerwano')).toBeInTheDocument();
});
it('licznik namierzania w pasku', () => {
  renderWithStore(<Bar />, onBank({ trace: 42.4 }));
  expect(screen.getByText('42%')).toBeInTheDocument();
  expect(document.querySelector('#trc')).toHaveClass('pause');
});
it('licznik: ukryty bez sesji, gorący przy Wytrychu > 70%, dopisek pobierania', () => {
  const { unmount } = renderWithStore(<Bar />, withSrv(cracking(), { trace: 0 }));
  expect(document.querySelector('#trc')).not.toBeNull();
  unmount();
  const r1 = renderWithStore(<Bar />, withSrv(cracking(), { trace: 75 }));
  expect(document.querySelector('#trc')).toHaveClass('hot');
  r1.unmount();
  const dl = runLine(runLine(onBank(), 'cd archiwum').state, 'get zestawienie_oddzialow_2026_v2_kopia.xlsx').state;
  renderWithStore(<Bar />, realtimeTick(dl, 2000).state);
  expect(document.querySelector('#trc')).not.toHaveClass('pause');
  expect(screen.getByText(/· pobieranie \d+%/)).toBeInTheDocument();
});
it('licznik: brak bez namierzania i poza serwerem', () => {
  renderWithStore(<Bar />, withSrv(runLine(onBank(), 'disconnect').state, { trace: 0 }));
  expect(document.querySelector('#trc')).toBeNull();
});
