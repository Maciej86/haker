// Teksty zlecenia L. „Spacer o 21:14”, 1:1 z mockups/misja.html (linie podane przy stałych).
import type { NoteCard, StageDef } from '../../engine/missions';

/** Linia 770. */
export const M3_OFFER_BODY: string[] = [
  'Dziś wieczorem nasz człowiek idzie na spotkanie w <b>Hotelu Luksus</b> (wieżowiec w <b>centrum Poznania</b>). O <b>21:14</b> wyjdzie z windy na <b>7. piętrze</b> i przejdzie do <b>pokoju 712</b>. Zajmie mu to 3 minuty. Potem wróci tą samą drogą do windy. Godziny wyjścia jeszcze nie znam: napiszę do Ciebie <b>5 minut przed tym, jak wyjdzie z pokoju</b>.',
  'Nie może go być na nagraniach z kamer hotelu. Kamery na jego drodze muszą być wyłączone, kiedy wyjdzie z windy. Wyłącz je najwcześniej o 21:13. Jeśli przestaną działać wcześniej, ochrona zauważy awarię i pójdzie sprawdzić. Jeśli wyłączysz je za późno, kamera go nagra. I pamiętaj: kamerę, która nie działa dłużej niż <b>7 minut</b>, ochrona idzie sprawdzić.',
  'Płacę 2000 ¤. Wchodzisz w to?',
];

/** Linia 1850. */
export const M3_ACCEPT_REPLY = 'Wchodzę w to. Twój człowiek przejdzie niezauważony.';

/** M3_ACC.txt, linia 771. */
export const M3_ANSWER = 'Dobrze. Hotel ma kamery w sieci wieżowca, a do niej wchodzi się przez <b>skrzynkę operatora S1</b> obok budynku. Paczkę z <b>PODSŁUCHEM-1</b> i <b>kluczem do szafki</b> zostawię pod ławką na przystanku obok wieżowca. Jeśli masz już własny sprzęt przy tej skrzynce, tym lepiej.<br>W załączniku <b>plan 7. piętra</b> z kamerami. Adresów kamer nie znam, to już Twoja działka.';
export const M3_ANSWER_TOAST = 'L. odpisał: paczka pod ławką, plan piętra w Notatkach';

/** STAGES_M3 (715–716) i COACH_M3 (717–724). */
export const M3_STAGES: StageDef[] = [
  { title: 'Przyjęcie zlecenia', sub: 'oferta L. w Poczcie', coach: 'Przeczytaj ofertę od L. w Poczcie i odpowiedz, żeby przyjąć.' },
  { title: 'Wyjazd i podłożenie podsłuchu', sub: 'paczka z przystanku, skrzynka S1', coach: 'Mapa → Poznań → Centrum → wieżowiec z hotelem → „Zaplanuj wyjazd”. Jeśli przy S1 wisi już Twój PODSŁUCH-1, wystarczy <code>use S1</code>.' },
  { title: 'Połączenie z podsłuchem', sub: 'Terminal → use S1', coach: 'W Terminalu: <code>use S1</code>.' },
  { title: 'Kamery na trasie', sub: 'scan, probe, Plan piętra', coach: '<code>scan</code>, potem <code>probe</code> na kamerach z podsieci hotelu. Na Planie piętra zobacz, które dwie kamery widzą drogę winda → korytarz B → 712.' },
  { title: 'Okno 21:14: do 712', sub: 'cam off albo at', coach: 'Do 21:14 masz czas. Najprościej: <code>at 21:14 cam off &lt;ip&gt; 3m</code> dla obu kamer z drogi, a potem „⏩ Przewiń” na dużym zegarze u góry. Ręcznie: „⏩ Przewiń do 21:10”, <code>use S1</code>, a o 21:13 <code>cam off</code> dla obu kamer. Ostatnie minuty płyną na żywo.' },
  { title: 'Powrót z 712', sub: 'L. napisze 5 min przed wyjściem', coach: 'Najpierw włącz kamery (<code>cam on</code>), jeśli wyłączałeś ręcznie: po 7 min awarii ochrona sprawdza. Potem czekaj na wiadomość od L.: „⏩ Czekaj na wiadomość od L.” na zegarze u góry. Gdy napisze, masz 5 minut: te same dwie kamery, w drugą stronę. Szybko: <code>use S1</code> i <code>at &lt;godzina&gt; cam off &lt;ip&gt; 3m</code> albo <code>cam off</code> od minuty przed wyjściem.' },
  { title: 'Raport dla L.', sub: 'posprzątaj, rozłącz się, odpisz', coach: 'Włącz kamery (<code>cam on</code>) albo poczekaj na koniec zadań at, potem <code>disconnect</code> i odpisz L. w Poczcie.' },
];

/** CLUES.m3mail i CLUES.m3plan, linie 1018–1019: widoczne po przyjęciu. */
export const M3_NOTES: NoteCard[] = [
  { id: 'm3mail', src: 'Mail od L.', html: 'O <b>21:14</b> nasz człowiek wyjdzie z <b>windy na 7. piętrze</b> Hotelu Luksus i przejdzie do <b>pokoju 712</b> (3 min), a później wróci tą samą drogą: L. napisze <b>5 minut przed wyjściem</b>. Kamery na jego drodze wyłącz najwcześniej o 21:13 i nie później niż o 21:14. Kamera wyłączona dłużej niż <b>7 minut</b> = obchód ochrony.', when: (s) => s.active === 'm3' },
  { id: 'm3plan', src: 'Plan 7. piętra (od L.)', html: 'Cztery kamery: przy windzie, w korytarzu A (701–706, schody), w korytarzu B (707–712) i na klatce schodowej. Adresów brak. Okno „Plan piętra” na pulpicie.', when: (s) => s.active === 'm3' },
];

/** Linia 1805. */
export const M3_NOTES_TITLE = 'Notatki · zlecenie L.';
/** Linia 1443. */
export const M3_NOTES_INTRO = 'Od L.';
/** Linia 1445. */
export const M3_NOTES_FOOTER = 'Skrzynka S1 obsługuje cały wieżowiec: 22 piętra, siedmiu lokatorów (recepcja z kawiarnią Ziarno, Bank Wiślany, Hotel Luksus, Data-Tech, Pixel, FitTower, Panorama). Każdy lokator ma swój przełącznik. Który jest który, trzeba ustalić.';

/** Linia 1803. */
export const M3_ACCEPTED_LINE = '<span class="c">Zlecenie przyjęte.</span> Hotel Luksus, 7. piętro, okno 21:14. Dostęp: skrzynka S1 przy wieżowcu.';
/** Linia 1804 bez porady „Sprawdź: devices” (Terminal nie podpowiada). Wstawka {zapas}. */
export const M3_DIRECT_LINE = '<span class="d">Przy S1 wisi już Twój PODSŁUCH-1 (zapas {zapas} min).</span>';

/** Linia 1435: kamera z p. 7. Wstawki {ip}, {kto}. */
export const M3_PROBE_CAM = '<span class="c">{ip} to {kto}.</span> <span class="d">Zaznaczona na planie piętra.</span>';
/** Linia 1435: inne urządzenie. Wstawki {ip}, {kto}. */
export const M3_PROBE_OTHER = '<span class="d">{ip} to {kto}.</span>';
/** Linia 1038: panel podpowiedzi NetMap. */
export const M3_NET_HINT = '<div class="hint" style="opacity:.8">Zlecenie L.: szukasz kamer z 7. piętra hotelu. Sprawdzone kamery pojawią się z adresem na planie piętra.</div>';

/** Linia 1767, wnętrze <p>. */
export const M3_PLAN_FOOTER = 'Żółte pole = kamera widzi. Adres kamery poznasz przez <code>probe</code>. Trasa: winda → korytarz B → 712.';
