// Teksty ekranu wyjazdu z wyjazd.tpl.html (262–268, 281–305, 341–357, 409–410), jako funkcje z parametrami.
// Zwracają HTML (te same wstawki <b>, <span>, co w makiecie) albo zwykły tekst.
import type { TripDef, Transport, TripPlan } from '../../engine/trip';
import type { TripRoutes } from '../city/types';
import { dur } from '../../engine/clock';

/** Godzina z minut od północy, po północy zawija się (np. 25:11 → 01:11). */
export const hm = (m: number): string => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.round(m) % 60).padStart(2, '0')}`;
const fmtN = (n: number) => n.toLocaleString('pl-PL');

export const TRIP_TEXT = {
  // --- plan (262–268) ---
  planTitle: '· Poznań, Centrum · skrzynka S1',
  planLegName: 'Trasa: Nowy Tomyśl → Poznań, Centrum',
  targetCard: (streets: TripRoutes, def: TripDef) =>
    `<b>◎ Skrzynka S1</b> · Net-Operator · zabezpieczenia ▮▯▯<br><span style="color:var(--dim)">${streets.s1Street}, Poznań, dzielnica Centrum. Obsługuje wieżowiec z centralą Banku Wiślanego i Hotelem Luksus.<br>📦 Paczka od ${def.packageFrom} (PODSŁUCH-1 i klucz do szafki): pod ławką na przystanku autobusowym obok banku.</span>`,
  optionDesc: (t: Transport, p: TripPlan) => {
    if (t.kind === 'train') {
      return `<span class="tt"><span>tam</span><span>odjazd <b>${hm(p.dep!)}</b> · w Poznaniu <b>${hm(p.dep! + t.ride)}</b></span><span>powrót</span><span>odjazd <b>${hm(p.backDep!)}</b> · w Tomyślu <b>${hm(p.backDep! + t.ride)}</b></span></span>w pociągu łącznie ${dur(2 * t.ride)} · przy skrzynce ${hm(p.arrive)} · w domu ${hm(p.end)}`;
    }
    return `${t.ride} min jazdy + parkowanie, ${t.park} ¤ · na miejscu ${hm(p.arrive)} · w domu ${hm(p.end)}`;
  },
  tooPoor: 'za mało ¤',
  bag: (def: TripDef, hasPackage: boolean) => [
    { name: 'PODSŁUCH-1', state: hasPackage ? 'w plecaku' : 'do odebrania · przystanek obok banku', tone: 'coin' as const },
    { name: 'klucz do szafki S1', state: hasPackage ? 'w plecaku' : `w paczce od ${def.packageFrom}`, tone: 'coin' as const },
    // [decyzja] w demo Darknet nie sprzedaje kamizelki
    { name: 'kamizelka serwisanta', state: 'brak · niedostępne w demo', tone: 'dim' as const },
  ],
  summaryRows: (day: string, start: number, arrive: number, end: number, cost: number, deadline: number): [string, string, string?][] => [
    ['wyjście z domu', `${day} ${hm(start)}`],
    ['przy skrzynce', `${day} ${hm(arrive)}`],
    ['powrót do domu', `${day} ${hm(end)}`],
    ['czas wyjazdu', dur(end - start)],
    ['koszt', `${cost} ¤ (tam i z powrotem)`],
    ['po powrocie', end <= deadline ? `do terminu zostanie ${dur(deadline - end)}` : 'po terminie zlecenia!', end <= deadline ? 'good' : 'warn'],
  ],
  goBtn: 'Jedź',
  cancelBtn: 'Anuluj',
  cancelTitle: 'Wraca do mapy, nic nie kosztuje',
  planNote: 'Komputer jest zablokowany do powrotu. Urządzenie zaczyna pracować dopiero, gdy wrócisz i użyjesz go w terminalu.',
  skipFast: '⏩ przyspiesz',
  skipNormal: '▶ normalnie',

  // --- przejazd (281–305): dziennik, tony: '' | 'dim' | 'acc' | 'red' ---
  leave: (streets: TripRoutes) => `Wychodzisz z domu, ${streets.homeStreet}. Komputer zostaje zablokowany.`,
  station: (t: Transport, dep: number) => `Dworzec Nowy Tomyśl. ${t.name} do Poznania Głównego o ${hm(dep)}, peron 2.`,
  ticket: (cost: number) => `Kupujesz bilet w automacie: −${cost} ¤.`,
  departure: (id: string) => `Odjazd. ${id === 'regio' ? 'Przystanki: Opalenica, Buk, Poznań Górczyn.' : 'Bez zatrzymań do Poznania.'}`,
  arrivalStation: (streets: TripRoutes) => 'Poznań Główny. Wychodzisz z dworca na ul. ' + streets.stationStreet + '.',
  carA2: (cost: number) => `Wjeżdżasz na A2 w stronę Poznania. Paliwo i opłata za autostradę: −${cost} ¤.`,
  carExit: (streets: TripRoutes) => `Zjazd z A2. Jedziesz do Centrum, ${streets.entryStreet}.`,
  parkSearch: (streets: TripRoutes) => `Szukasz miejsca, ${streets.parkStreet}…`,
  parked: (park: number) => `Parkujesz w strefie płatnego parkowania: −${park} ¤.`,
  onSite: (streets: TripRoutes) => `Jesteś na miejscu, ${streets.s1Street}. Bank, przystanek i szara szafka Net-Operatora S1 są kilka kroków od siebie.`,
  fledRun: 'Biegniesz dwie przecznice, potem zwalniasz i wtapiasz się w tłum.',
  walkBack: 'Wracasz tą samą drogą.',
  backTrain: (t: Transport, dep: number, wait: number) =>
    `Poznań Główny. Najbliższy ${t.name.toLowerCase()} do Nowego Tomyśla o ${hm(dep)}${wait > 20 ? ` — czekasz ${wait} min` : ''}.`,
  backTicket: (cost: number) => `Bilet powrotny: −${cost} ¤.`,
  backCar: (cost: number) => `Paliwo i autostrada w drodze powrotnej: −${cost} ¤.`,
  home: (streets: TripRoutes) => `W domu, ${streets.homeStreet}. Komputer odblokowany.`,

  // --- na miejscu (341–357) ---
  stepHints: {
    package: 'Przystanek autobusowy obok banku. Pod ławką leży szara koperta bąbelkowa.',
    packageDone: 'W kopercie jest PODSŁUCH-1, klucz do szafki i karteczka: „S1, szafka za rogiem”. Wkładasz wszystko do plecaka.',
    lookBtn: '▶ Rozejrzyj się',
    look: 'Ulica prawie pusta. Kobieta z psem przechodzi na drugą stronę.',
    packageBtn: '▶ Idź na przystanek po paczkę',
    openDrag: 'Przeciągnij <b>klucz</b> z plecaka na <b>zamek</b> szafki.',
    open: 'Klucz pasuje. Zamek chodzi ciężko, ktoś dawno tu nie zaglądał.',
    plugDrag: 'Przeciągnij <b>PODSŁUCH-1</b> z plecaka do <b>wolnego portu</b> (żółta ramka).',
    plug: 'Wsuwasz urządzenie do wolnego portu w trzecim rzędzie. Dioda mruga na żółto.',
    testDrag: 'Przeciągnij <b>telefon</b> z plecaka na <b>PODSŁUCH-1</b>. Aplikacja połączy się z urządzeniem przez Bluetooth.',
    testStart: 'Przykładasz telefon. Aplikacja Łącznik szuka urządzenia…',
    test: 'Łącznik: urządzenie połączone, sygnał z sieci jest. Dioda na PODSŁUCHU świeci na zielono.',
    closeBtn: '▶ Zamknij szafkę',
    close: 'Zamykasz drzwiczki. Z zewnątrz nic nie widać.',
    leaveBtn: '▶ Odejdź spokojnie',
    fled1: 'Zostawiasz otwartą szafkę i uciekasz. PODSŁUCH-1 zostaje w plecaku.',
    fled2: 'Skrzynka S1: <b>miejsce podejrzliwe</b>. Operator pewnie wymieni zamek i doda zabezpieczenia.',
  },
  bagItems: (def: TripDef) => [
    { k: 'key', g: '🗝', name: 'klucz do szafki', sub: 'z paczki od ' + def.packageFrom },
    { k: 'dev', g: '▣', name: 'PODSŁUCH-1', sub: '60 min pracy' },
    { k: 'phone', g: '▯', name: 'telefon', sub: 'aplikacja do PODSŁUCHU, Bluetooth' },
  ],
  phone: {
    top: '📶 Bluetooth · aplikacja Łącznik',
    rows: ['● PODSŁUCH-1 połączony', 'port: panel 6, gniazdo 4', 'łącze S1 · Net-Operator · ▮▯▯', '● sygnał z sieci: jest', 'czas pracy: 60 min (zużywa się podczas pracy)', 'po powrocie: Terminal → use S1'],
  },
  approach: '⚠ Ktoś do ciebie podchodzi.',
  youSaid: (txt: string) => `Ty: „${txt}”`,
  talkAlarm: '⚠ przyłapany przy szafce',
  talkPlain: 'rozmowa',
  talkOk: 'Przechodzień odchodzi. Możesz pracować dalej.',
  talkFled: 'Musisz uciekać. Szafka zostaje otwarta, urządzenie nie jest podpięte.',
  talkBtn: { ok: '▶ Wróć do szafki', fled: '▶ Uciekaj', next: '▶ Dalej' },
  talkGainLine: (v: number, why: string) => `+${fmtN(v)} Social · ${why}.`,
  talkGainBadge: (v: number, badge: string) => `+${fmtN(v)} Social · ${badge}`,

  // --- koniec (409–410) ---
  doneTitle: { ok: 'Wyjazd zakończony', fled: 'Wyjazd zakończony ucieczką' },
  doneRows: (ok: boolean, o: { start: string; end: string; took: string; spent: number; soc: number; socWhy: string; left: string; leftOk: boolean }): [string, string, string?][] => {
    const rows: [string, string, string?][] = [
      ['czas', `${o.start} → ${o.end} (${o.took})`],
      ['wydano', `${o.spent} ¤`],
      ['urządzenie', ok ? 'PODSŁUCH-1 online przy S1 · 60 min pracy' : 'PODSŁUCH-1 w plecaku, nie podpięty', ok ? 'good' : 'warn'],
    ];
    if (!ok) rows.push(['skrzynka S1', 'miejsce podejrzliwe · operator może wzmocnić zabezpieczenia', 'warn']);
    if (o.soc) rows.push(['umiejętności', `+${fmtN(o.soc)} Social (${o.socWhy})`, 'good']);
    rows.push(['do terminu', o.left, o.leftOk ? 'good' : 'warn']);
    return rows;
  },
  backToPc: 'Wróć do komputera',
  doneNote: {
    ok: 'Przycisk zamyka okno i odblokowuje komputer. Dalej: Terminal → use S1.',
    // [decyzja] zamiast „kamizelki”, której w demo nie ma w sklepie
    fled: 'Misja trwa dalej. PODSŁUCH-1 i klucz masz w plecaku: zaplanuj kolejny wyjazd z Mapy.',
  },
  progressTitle: 'Postęp zlecenia',
  progress: (def: TripDef, day: string, ok: boolean) =>
    def.progress.map((p, i) => ({
      title: p.title,
      sub: p.sub.replace('{dzień}', day),
      state: i < def.tripStage ? 'done' : i === def.tripStage ? (ok ? 'done' : 'fail')
        : i === def.tripStage + 1 && ok ? 'next' : '',
    })),
};
