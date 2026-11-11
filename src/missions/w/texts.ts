// Teksty zlecenia W. 1:1 z mockups/misja.html (numery linii w komentarzach).
// Terminal nie podpowiada: zdania mówiące graczowi, co zrobić dalej, są pominięte (należą do „co teraz”).
import type { HelpGroup } from '../../engine/help';
import type { NoteCard, StageDef } from '../../engine/missions';
import type { GameState } from '../../engine/types';

export const W_TARGET_IP = '10.42.7.12';

/** Linia 763. */
export const W_OFFER_BODY: string[] = [
  'Potrzebuję zestawienia oddziałów z centrali <b>Banku Wiślanego</b> w <b>Poznaniu</b>. Centrala mieści się w <b>centrum miasta</b>. Plik leży na ich serwerze w budynku centrali.',
  'Interesuje mnie wersja <b>przyjęta na zarządzie 20 października</b>, podpisana przez <b>dyr. Nowak</b>. Robocze szkice, „finalne” wersje bez podpisu i stare lata mnie nie obchodzą.',
  'Termin: <b>dziś 19:00</b>. Wynik odeślij mi jako załącznik. Dasz radę?',
];

/** Linia 788. */
export const W_ACCEPT_REPLY = 'Zdobędę dla Ciebie ten plik.';
/** Linia 789 (ACC_THREAD[1].txt). */
export const W_ANSWER = 'Świetnie. Do ich sieci najłatwiej wejść przez <b>skrzynkę operatora</b>, która obsługuje budynek banku. Znajdź ją na mapie i podepnij tam <b>PODSŁUCH-1</b> (ok. godziny pracy). Paczkę znajdziesz <b>pod ławką na przystanku autobusowym obok banku</b>. W środku jest <b>PODSŁUCH-1</b> i <b>klucz do szafki</b> operatora. Jeśli masz już własny sprzęt przy tej skrzynce, tym lepiej.';
/** Linia 1864. */
export const W_ANSWER_TOAST = 'W. odpisał: paczka czeka na przystanku obok banku';

/** STAGES (682–690) i COACH (691–698). */
export const W_STAGES: StageDef[] = [
  { title: 'Przyjęcie zlecenia', sub: 'odpowiedz W. w Poczcie', coach: 'Przeczytaj mail od W. w Poczcie i odpowiedz, żeby przyjąć zlecenie.' },
  { title: 'Rozpoznanie: cel na mapie', sub: 'Mapa → Poznań → bank i skrzynka', coach: 'Otwórz <code>Mapę</code>: Polska → Poznań → Centrum. Najedź na budynki, żeby zobaczyć lokatorów. Kliknięcie budynku planuje wyjazd.' },
  { title: 'Wyjazd i podłożenie podsłuchu', sub: 'paczka z przystanku, skrzynka S1', coach: 'Wyjazd odbywa się poza komputerem.' },
  { title: 'Połączenie z podsłuchem', sub: 'Terminal → use S1', coach: 'Terminal: połącz się z urządzeniem przy skrzynce (<code>use S1</code>). Licznik urządzenia jest w górnym pasku.' },
  { title: 'Znalezienie celu', sub: 'schemat sieci za S1 + rozpoznanie', coach: 'Terminal: <code>scan</code>, potem filtry (<code>--net</code>, <code>--type</code>, <code>--off</code>) i <code>probe &lt;ip&gt;</code>. NetMap rysuje wynik, Notatki mają wiedzę z rozpoznania.' },
  { title: 'Włamanie', sub: 'łamigłówka z namierzaniem', coach: 'Terminal: <code>crack &lt;ip&gt;</code>, potem połącz przewody w oknie Wytrych. <code>abort</code> przerywa.' },
  { title: 'Oddanie zlecenia', sub: 'plik mailem przed terminem, 19:00', coach: 'Terminal: <code>mc</code> otwiera pliki serwera. Szukaj po szczegółach (Enter na pliku), pobierz <code>F5</code>. Na koniec <code>disconnect</code> (serwer, potem S1) i wyślij plik W. w Poczcie.' },
];

/** CLUES.mail, CLUES.phone, CLUES.route (linie 1016, 1017, 1020). */
export const W_NOTES: NoteCard[] = [
  { id: 'mail', src: 'Mail od W.', html: 'Zestawienie leży na <b>serwerze</b> w centrali banku. Potrzebna wersja <b>przyjęta na zarządzie 20 października</b>, podpisana przez <b>dyr. Nowak</b>.' },
  { id: 'phone', src: 'Telefon do centrali', html: '„Po 18 wszystko gasimy. Zostają tylko kamery, <b>strona dla klientów</b> i <b>nocne kopie</b>.”' },
  { id: 'route', src: 'Konto klienta · route bank', html: 'Twój ruch do banku idzie przez <b>10.42.7.1</b> i kończy się na <b>10.42.7.20</b> (bankowość internetowa).' },
];
/** Linia 1443 (resztę, „ Czytanie nic nie kosztuje.”, dokleja notesView). */
export const W_NOTES_INTRO = 'Zebrane w etapie Rozpoznanie.';
/** Linia 1445. */
export const W_NOTES_FOOTER = 'Skrzynka S1 obsługuje cały wieżowiec: 22 piętra, siedmiu lokatorów (recepcja z kawiarnią Ziarno, Bank Wiślany, Hotel Luksus, Data-Tech, Pixel, FitTower, Panorama). Każdy lokator ma swój przełącznik. Który jest który, trzeba ustalić.';

/** HINTS, linia 1037. */
export const W_HINTS: { price: number; text: string }[] = [
  { price: 15, text: 'Zacznij od trasy z konta klienta: która podsieć należy do banku?' },
  { price: 30, text: 'Bank po 18 gasi wszystko poza kamerami, stroną i kopiami. Szukasz serwera, który <b>gaśnie</b> wieczorem.' },
  { price: 60, text: 'W podsieci 10.42.7.x jest jeden serwer aktywny tylko w godzinach pracy.' },
];

/** Linia 1867. */
export const W_ACCEPTED_LINE = '<span class="c">Zlecenie przyjęte.</span> Cel: centrala Banku Wiślanego, Poznań. Paczka z PODSŁUCHEM-1 i kluczem do szafki: przystanek obok banku.';
/** Linia 1868 bez porady „Sprawdź: devices” (Terminal nie podpowiada). Wstawka {zapas}. */
export const W_DIRECT_LINE = '<span class="d">Bank jest w wieżowcu przy skrzynce S1, a tam wisi już Twój PODSŁUCH-1 (zapas {zapas} min).</span>';

/** Linie 1437–1438. Wstawki {ip}, {kto}. */
export const W_HIT_LINES: string[] = [
  '<span class="c">{ip} to {kto}. Serwer plików, chroniony hasłem.</span>',
  '<span class="y">Cel znaleziony.</span>',
];
/** Linia 1439. Wstawki {ip}, {kto}. */
export const W_MISS_LINE = '<span class="r">{ip} to {kto}. Nie to.</span> <span class="d">Stracono 6 min gry i 3 min urządzenia.</span>';
/** Linia 1438. */
export const W_HIT_TOAST = 'Cel znaleziony · krok „Znalezienie celu” zaliczony';
/** Linia 922. */
export const W_ALREADY_FOUND = '<span class="d">Cel już znaleziony.</span>';

/** Grupa Ściągi „Włamanie”, linie 1092–1094. */
export const W_HELP_CRACK: HelpGroup = {
  title: 'Włamanie',
  need: 'po znalezieniu celu',
  unlocked: (s: GameState) => s.mission.w.found,
  entries: [
    { cmd: 'crack 10.42.7.12', desc: 'włamanie do chronionego urządzenia; otwiera Wytrych i uruchamia namierzanie', cost: 'start: 5 min gry · 2 min urządzenia, potem 1 min gry i urządzenia co 10 s' },
    { cmd: 'abort', desc: 'przerywa włamanie, namierzanie opada', cost: '' },
  ],
};
