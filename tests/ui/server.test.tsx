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
import { at, cracking, onBank } from '../missions/w/helpers';
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

// ── część 2: mc i edytor logu w oknie Terminala ──
it('mc: Enter wchodzi do katalogu za +2%, F10 zamyka', async () => {
  const { store } = renderWithStore(<Terminal />, runLine(onBank(), 'mc').state);
  expect(screen.getByText('~/Pobrane (ten komputer)')).toBeInTheDocument();
  expect(screen.queryByLabelText('Polecenie')).toBeNull();
  await user.keyboard('{Enter}');                            // w / pierwszy wiersz to archiwum (bez ..)
  expect(store.get().terminal.location).toMatchObject({ path: '/archiwum' });
  expect(store.get().srv.trace).toBeCloseTo(2);
  expect(screen.getByText(/polecenie:/)).toHaveTextContent('cd archiwum namierzanie +2%');
  await user.keyboard('{F10}');
  expect(store.get().srv.mc.open).toBe(false);
  expect(screen.getByLabelText('Polecenie')).toBeInTheDocument();
});
it('mc: strzałki za darmo, ← wraca i zaznacza katalog, Enter na pliku to info, F3 podgląd', async () => {
  const { store, container } = renderWithStore(<Terminal />, runLine(at(onBank(), '/zarzad'), 'mc').state);
  const sel = () => container.querySelector('.mc .row.sel')!.textContent;
  expect(sel()).toContain('/..');
  await user.keyboard('{ArrowDown}');
  expect(sel()).toContain('/protokoly'); expect(store.get().srv.trace).toBeCloseTo(0);
  await user.keyboard('{ArrowRight}');
  expect(store.get().terminal.location).toMatchObject({ path: '/zarzad/protokoly' });
  await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
  expect(store.get().srv.known).toContain('protokol_2026-10-20.pdf');
  expect(container.querySelector('.mc .info')!.innerHTML).toContain('autor <i>sekretariat</i>');
  await user.keyboard('{F3}');
  expect(screen.getByText('podgląd: /zarzad/protokoly/protokol_2026-10-20.pdf')).toBeInTheDocument();
  expect(container.querySelector('.mc .view')!.textContent).toContain('Uchwała 14/2026');
  await user.keyboard('{Escape}');
  expect(store.get().srv.mc).toEqual({ open: true, preview: null });
  await user.keyboard('{ArrowLeft}');
  expect(store.get().terminal.location).toMatchObject({ path: '/zarzad' });
  expect(sel()).toContain('/protokoly');
});
it('mc: przycisk F5 pobiera, Pobrane w prawym panelu', async () => {
  const { store, container } = renderWithStore(<Terminal />, runLine(at(onBank(), '/pracownicy/m.kowal'), 'mc').state);
  expect(screen.getByText('pusto')).toBeInTheDocument();
  await user.keyboard('{ArrowDown}');
  await user.click(screen.getByRole('button', { name: /F5/ }));
  expect(store.get().srv.dl).toMatchObject({ path: '/pracownicy/m.kowal/lista_zakupow.txt' });
  act(() => store.apply(realtimeTick(store.get(), 3000)));
  expect(container.querySelectorAll('.mc .pane')[1].textContent).toContain('lista_zakupow.txt');
  expect(screen.getByText('pobrany')).toBeInTheDocument();
});
it('edytor: Ctrl+K usuwa wiersz za +1%, F2 zapisuje', async () => {
  const { store } = renderWithStore(<Terminal />, runLine(at(onBank(), '/it/logi'), 'edit auth.log').state);
  expect(screen.getByText(/edycja: 10.42.7.12:\/it\/logi\/auth.log/)).toBeInTheDocument();
  await user.keyboard('{Control>}k{/Control}');
  expect(screen.getByText(/niezapisane zmiany/)).toBeInTheDocument();
  expect(store.get().srv.trace).toBeCloseTo(3);
  await user.keyboard('{F2}');
  expect(store.get().srv.editor!.dirty).toBe(false);
  expect(store.get().srv.logClean).toBe(true);
  await user.keyboard('{Escape}');
  expect(store.get().srv.editor).toBeNull();
  expect(screen.getByLabelText('Polecenie')).toBeInTheDocument();
});
it('edytor z mc: F4, strzałki, Delete, Esc wraca do paneli', async () => {
  const { store, container } = renderWithStore(<Terminal />, runLine(at(onBank(), '/it/logi'), 'mc').state);
  await user.keyboard('{ArrowDown}{F4}');
  expect(store.get().srv.editor!.fromMc).toBe(true);
  expect(container.querySelectorAll('.mc .view .ln')).toHaveLength(store.get().srv.log.length);
  expect(container.querySelector('.mc .view .ln.sel .me')).not.toBeNull();
  await user.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}{Delete}{Escape}');
  expect(store.get().srv.editor).toBeNull();
  expect(store.get().terminal.lines.at(-1)!.html).toContain('Wyjście bez zapisu');
  expect(screen.getByText('~/Pobrane (ten komputer)')).toBeInTheDocument();
});
it('mc nie rysuje się poza serwerem', () => {
  const s = runLine(onBank(), 'mc').state;
  renderWithStore(<Terminal />, { ...s, terminal: { ...s.terminal, location: { kind: 'S1' } } });
  expect(screen.queryByText('~/Pobrane (ten komputer)')).toBeNull();
});
