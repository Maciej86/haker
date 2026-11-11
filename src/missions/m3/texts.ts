// Teksty zlecenia L. „Spacer o 21:14”, 1:1 z mockups/misja.html (linie podane przy stałych).
import type { NoteCard, StageDef, TripDef } from '../../engine/missions';
import type { HelpGroup } from '../../engine/help';

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

/** Wyjazd do Poznania po paczkę od L. (wartości ustalone w planie 30; mapLabel: mapa-polski.tpl.html linia 234). */
export const M3_TRIP: TripDef = {
  city: 'Poznań',
  mapLabel: 'Hotel Luksus, 7. piętro, wieżowiec w centrum Poznania',
  mapText: 'Kamery w Hotelu Luksus, wieżowiec w centrum Poznania. Budynek trzeba znaleźć samemu.',
  packageFrom: 'L.',
  deadline: 21 * 60 + 14,
  progressSub: 'kamery w Hotelu Luksus',
  progress: [
    { title: 'Rozpoznanie', sub: 'mail od L., plan 7. piętra' },
    { title: 'Podłożenie podsłuchu przy skrzynce', sub: 'wyjazd do Poznania' },
    { title: 'Połączenie z podsłuchem', sub: 'komputer w domu, Terminal → use S1' },
    { title: 'Zadanie właściwe', sub: 'zależy od zlecenia; tu: kamery na drodze z windy do pokoju 712 wyłączone o 21:14' },
    { title: 'Oddanie zlecenia', sub: 'krótki raport dla L. po powrocie z 712' },
  ],
  tripStage: 1,
};

/** Linia 1793 bez „Teraz kliknij „⏩ Przewiń do …” … albo wpisz disconnect i wait” (Terminal nie podpowiada). */
export const M3_AT_READY = '<span class="y">Obie kamery z drogi mają zadania.</span>';
/** Własny tekst: zadania at przepadły, bo podsłuch padł. */
export const M3_JOBS_LOST = '<span class="r">Zadania at przepadły: PODSŁUCH-1 wyczerpany.</span>';

/** Ściąga, grupa „Kamery (zlecenie L.)”, linie 1088–1091. */
export const M3_HELP_CAMS: HelpGroup = {
  title: 'Kamery (zlecenie L.)',
  unlocked: (s) => s.active === 'm3',
  need: 'w zleceniu L.',
  entries: [
    { cmd: 'cam off 10.42.5.31', desc: 'wyłącza kamerę od razu; cam on włącza z powrotem', cost: 'wymaga połączenia z S1' },
    { cmd: 'at 21:14 cam off 10.42.5.31 3m', desc: 'zadanie na PODSŁUCHU-1: wyłączy kamerę o tej godzinie na podany czas; działa też po rozłączeniu; samo at = lista', cost: '1 min gry' },
    { cmd: 'wait 21:10', desc: 'czekasz do podanej godziny; połączony podsłuch zużywa wtedy zapas', cost: '' },
  ],
};

// Ocena okna (makieta linie 1706–1711, 1724–1741). Wstawki: {kamery} „kamery”/„kamera”, {nazwy} „przy windzie i korytarz B”.
/** Linia 1707. Wstawki {kamery}, {nazwy}, {działały}, {max}, {je}. */
export const M3_OVERFLOW = 'Ochrona zrobiła obchód: {kamery} {nazwy} nie {działały} dłużej niż {max} minut. Zrestartowali {je}.';
/** Linia 1709: dopisek maila przy drugim błędzie. */
export const M3_OVERFLOW_FAIL = ' To już drugi błąd. Zlecenie odwołane, nie płacę.';
/** Linia 1710: dopisek maila. */
export const M3_OVERFLOW_MAIL = ' Nic nie znaleźli, ale będą czujniejsi. Zapłacę mniej. Następny błąd i odwołuję zlecenie.';
/** Linia 1711. Wstawki {tc}, {txt}. */
export const M3_OVERFLOW_LINE = '<span class="r">{tc} · {txt}</span> <span class="d">To błąd: zapłata mniejsza, kolejny błąd = przegrana.</span>';
export const M3_OVERFLOW_TOAST = 'Ochrona sprawdziła kamerę: błąd';
/** Linie 1709, 1731. Wstawka {txt}. */
export const M3_FAIL_LINE = '<span class="r">{txt}</span> <span class="r">Zlecenie przegrane.</span>';
/** Linia 1728. Wstawki {kamery}, {nazwy}, {nie_działają}. */
export const M3_EARLY = 'Ochrona zauważyła, że {kamery} {nazwy} {nie_działają}, zanim ruszył, i poszła sprawdzić. Zrestartowali kamery.';
/** Linia 1729. Wstawki {Kamery}, {nazwy}, {działały}, {kiedy}. */
export const M3_LATE = '{Kamery} {nazwy} {działały}, kiedy {kiedy}.';
export const M3_LATE_THERE = 'wyszedł z windy';
export const M3_LATE_BACK = 'wychodził z pokoju';
/** Linia 1731: dopisek maila przy drugim błędzie. */
export const M3_WINDOW_FAIL = ' To już drugi raz. Zlecenie odwołane, nie płacę.';
/** Linia 1734: dopiski maila o drugiej próbie. */
export const M3_RETRY_LATE = ' Wycofał się. Zapłacę mniej.';
export const M3_RETRY_EARLY = ' Druga i ostatnia próba o <b>21:44</b>, a ochrona jest czujniejsza: okno tylko <b>2 minuty</b>.';
export const M3_RETRY_3 = ' Druga i ostatnia próba o <b>21:44</b> (3 minuty).';
/** Linia 1735. Wstawki {txt}, {len}. */
export const M3_RETRY_LINE = '<span class="r">{txt}</span> <span class="y">Nowe okno: 21:44, {len} min.</span>';
export const M3_RETRY_TOAST_EARLY = 'L.: za wcześnie. Nowe okno 21:44';
export const M3_RETRY_TOAST_LATE = 'L.: za późno. Nowe okno 21:44';
/** Linia 1739. Wstawka {hm}. */
export const M3_THERE_MAIL = 'Przeszedł o {hm}, jest w 712. Na nagraniach nikogo nie ma. Włącz kamery z powrotem, zanim minie 7 minut awarii. Napiszę 5 minut przed tym, jak wyjdzie z pokoju.';
/** Linia 1740 bez porad („Włącz kamery (cam on)… Na zegarze u góry: „⏩ Czekaj…”.”). Wstawka {hm}. */
export const M3_THERE_LINE = '<span class="c">{hm} · nasz człowiek przeszedł do 712. Nikt go nie widział.</span>';
/** Linia 1741. */
export const M3_THERE_TOAST = 'L.: jest w 712. Czekaj na wiadomość o wyjściu';

// Duży zegar (makieta linie 1813, 1817–1824). To UI, nie Terminal: podpowiedzi „co teraz” wolno.
export const M3_CLOCK_WIN = 'okno <b>{od}–{do}</b> · za <b>{za}</b>{żywo}';
export const M3_CLOCK_LIVE_TAG = ' · na żywo';
export const M3_CLOCK_RUNNING = 'okno trwa · <b>{do}</b> koniec';
export const M3_CLOCK_BACK = 'człowiek w <b>712</b> · L. napisze 5 min przed jego wyjściem';
export const M3_CLOCK_WARN = '<span style="color:var(--red)">⚠ wyłączone: {lista}</span>';
export const M3_CLOCK_WARN_AT = '.{n} (at, wróci {hm})';
export const M3_CLOCK_WARN_MAN = '.{n} włącz do {hm}';
export const M3_CLOCK_BLOCK = 'Najpierw włącz kamery (<code>cam on</code>): po {max} min awarii ochrona sprawdza.';
export const M3_CLOCK_JUMP = '⏩ Przewiń do {hm}';
export const M3_CLOCK_WAIT_L = '⏩ Czekaj na wiadomość od L.';
export const M3_CLOCK_READY = 'Zadania at są gotowe.';
export const M3_CLOCK_MANUAL = 'Zostaną 4 min: <code>use S1</code> (2 min), potem <code>cam off</code> dla kamer z drogi, ale nie przed {hm}.';
export const M3_CLOCK_DISCONNECT = 'Najpierw rozłączę cię z S1, żeby nie zużyć podsłuchu.';
export const M3_CLOCK_QUIET = 'Kamery działają, ochrona nic nie widzi.';
export const M3_CLOCK_LIVE = 'Czas płynie. {co}';
export const M3_CLOCK_LIVE_AT = 'Zadania at wykonają się same.';
export const M3_CLOCK_LIVE_WAIT = 'Kamery wyłącz od {hm}, nie wcześniej.';
export const M3_CLOCK_LIVE_NOW = 'Teraz: <code>cam off</code> dla kamer z drogi.';
export const M3_CLOCK_LIVE_CONNECT = 'Połącz się: <code>use S1</code>.';

// Droga powrotna (makieta linie 1713–1716, 1742–1746, 1823).
/** Linia 1714. Wstawka {hm}. */
export const M3_NOTICE_MAIL = 'Wychodzi za 5 minut, o <b>{hm}</b>. Ta sama droga w drugą stronę: z 712 korytarzem B do windy.';
/** Linia 1715. Wstawki {kiedy}, {hm}, {od}. */
export const M3_NOTICE_LINE = '<span class="y">{kiedy} · L.: wychodzi o {hm}. Ta sama droga, z 712 do windy.</span> <span class="d">Kamery na drodze wyłącz od {od}, nie wcześniej.</span>';
/** Linia 1716. Wstawka {hm}. */
export const M3_NOTICE_TOAST = 'L.: wychodzi o {hm}!';
/** Linia 1716: pasek misji w Terminalu. Wstawka {hm}. */
export const M3_BACK_STEP = 'powrót o {hm}: te same dwie kamery';
/** Linia 1823 (leg 2, na żywo). Wstawki {hm}, {co}: M3_CLOCK_LIVE_AT, M3_CLOCK_LIVE_WAIT, M3_CLOCK_LIVE_NOW albo M3_BACK_LIVE_CONNECT. */
export const M3_BACK_LIVE = 'Wychodzi o {hm}. {co}';
export const M3_BACK_LIVE_CONNECT = 'Połącz się: <code>use S1</code> (2 min).';
/** Linia 1744, wariant ok. Wstawka {hm}. */
export const M3_BACK_OK_MAIL = 'Wyszedł o {hm} i jest już poza hotelem. Nikt go nie widział. Odpisz mi krótko, kiedy wszystko posprzątasz.';
/** Linia 1744: dopisek maila po błędzie w drodze powrotnej. */
export const M3_BACK_BAD_TAIL = ' Zdążył wyjść, ale zostało nagranie. Zapłacę mniej. Odpisz, kiedy posprzątasz.';
/** Linia 1745, wariant ok, bez porady „Włącz kamery (albo poczekaj na koniec zadań at), rozłącz się i odpisz L. w Poczcie.” (Terminal nie podpowiada). Wstawka {hm}. */
export const M3_BACK_OK_LINE = '<span class="c">{hm} · wyszedł z 712 i zjechał windą. Nikt go nie widział.</span>';
/** Linia 1745, wariant z błędem. Wstawka {txt}. */
export const M3_BACK_BAD_LINE = '<span class="r">{txt}</span> <span class="d">Misja trwa, zapłata mniejsza. Posprzątaj i odpisz L.</span>';
/** Linia 1746. */
export const M3_BACK_OK_TOAST = 'L.: wyszedł niezauważony';
export const M3_BACK_BAD_TOAST = 'L.: nagrany przy wyjściu, zapłata mniejsza';
