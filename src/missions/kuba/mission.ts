import type { MissionDef } from '../../engine/missions';
import type { CommandTable } from '../../engine/terminal';
import type { GameState } from '../../engine/types';
import { step } from '../../engine/types';
import { drawBake, kubaConnectLocked, kubaCrack } from './logic';
import { K_ACCEPT_LINE, K_FLAT, K_HELP_TERM, K_NOTE_HTML, K_NOTHERE, KUBA_IP } from './texts';

const say = (html: string): CommandTable[string] => (_a, s) => step(s, [{ html }]);
const onZenek = (s: GameState) => s.terminal.location.kind === 'host' && s.terminal.location.ip === KUBA_IP;

/** Polecenia misji 1: mają pierwszeństwo przed wspólnymi; każde 0 min. */
const KUBA_COMMANDS: CommandTable = {
  scan: say(K_NOTHERE),
  use: say(K_NOTHERE),
  probe: say(K_NOTHERE),
  route: say(K_NOTHERE),
  mc: say(K_FLAT),
  cd: say(K_FLAT),
  info: say(K_FLAT),
  edit: say('<span class="d">Kuba chce tylko playlisty. Niczego nie zmieniaj u Zenka.</span>'),
  rm: say('<span class="d">Kuba chce tylko playlisty. Niczego nie usuwaj u Zenka.</span>'),
  devices: say('<span class="d">Nie masz jeszcze urządzeń w terenie.</span>'),
  abort: say('<span class="d">Nic nie trwa.</span>'),
  status: (_a, s) => step(s, [{
    html: onZenek(s)
      ? `<span class="c">Połączono z ${KUBA_IP}</span> · serwer domowy Zenka · <span class="d">namierzanie: brak (prywatny serwer nikogo nie pilnuje)</span>`
      : '<span class="d">Brak połączenia.</span>',
  }]),
  help: (_a, s) => step(s, [{ html: s.owned.includes('wyt') ? K_HELP_TERM.withCrack : K_HELP_TERM.plain }]),
};

const hasPlaylist = (s: GameState) => s.downloads.some((f) => f.fileId === `${KUBA_IP}:playlista.txt`);

export const kuba: MissionDef = {
  id: "kuba",
  title: "Playlista z imprezy",
  giver: { id: "kuba", name: "Kuba", dative: "Kubie" },
  barName: "Playlista z imprezy",
  noTripText: 'Do Zenka nie musisz jechać: znasz IP jego serwera.',
  availability: { afterMissions: [] },
  offer: {
    subject: "Playlista z imprezy",
    when: "śr 20:12",
    reward: 300,
    levelLabel: "Poziom 1",
    body: [
      "Siema! Pamiętasz Zenka z <b>piekarni na rogu</b>? Na imprezie puszczał muzykę ze swojego domowego serwerka i nie chce się nią podzielić. Mówi, że to „tajemnica zawodowa”. A ja chcę ją puścić w sobotę.",
      "Zenek na pewno ma hasło. Do łamania haseł potrzebny jest <b>Wytrych</b>: kupisz go w <b>Darknecie</b>, kosztuje ok. 100 ¤. Tylko nie mów Zenkowi :)",
      "Dasz radę ją zdobyć?",
    ],
    acceptReply: "Jasne. Byłem u Zenka dwa dni temu i mam zapisane IP jego serwerka. Połączę się bezpośrednio.",
    acceptCost: 1,
    giverAnswer: {
      delayMs: 1200,
      cost: 2,
      text: "O, to nawet nie musisz nigdzie jechać! Normalnie do cudzej sieci wchodzi się przez antenę albo skrzynkę operatora, ale Ty znasz adres.<br>W Terminalu: <b>connect</b> i jego IP. Zenek ma hasło, więc najpierw kup <b>Wytrycha</b> w Darknecie, a potem <b>crack</b> i to samo IP. Playlista to pewnie <b>playlista.txt</b>: ściągnij ją (<b>get</b>) i odeślij mi tutaj jako załącznik.",
      toast: "Kuba odpisał: connect, Wytrych z Darknetu, crack",
    },
  },
  introLine: "w Poczcie czeka wiadomość od Kuby.",
  notes: [{ id: 'zenek-ip', src: 'pon 18:40 · u Zenka w piekarni', html: K_NOTE_HTML, insert: `connect ${KUBA_IP}` }],
  stages: [
    { title: "Odpowiedź Kubie", sub: "Poczta: przyjmij zlecenie", coach: "Przeczytaj mail od Kuby w Poczcie i odpowiedz mu." },
    { title: "Połączenie z serwerem Zenka", sub: "IP z Notatek, connect", coach: "IP serwera Zenka masz w <code>Notatkach</code>. W Terminalu: <code>connect &lt;ip&gt;</code>." },
    { title: "Zakup Wytrycha", sub: "Darknet, 100 ¤", coach: "Serwer ma hasło. Otwórz <code>Darknet</code> i kup Wytrych 1.0." },
    { title: "Włamanie", sub: "Wytrych: zagadka z piekarni", coach: "Terminal: <code>crack &lt;ip&gt;</code>, potem rozwiąż zagadkę w oknie Wytrych." },
    { title: "Pobranie playlisty", sub: "ls, get, disconnect", coach: "Terminal: <code>ls</code> pokazuje pliki, <code>get playlista.txt</code> pobiera. Na koniec <code>disconnect</code>." },
    { title: "Oddanie zlecenia", sub: "plik mailem do Kuby", coach: "Poczta: odpowiedz Kubie i dołącz plik z Pobranych." },
  ],
  stageIndex: (s) => {
    const k = s.mission.kuba;
    const wyt = s.owned.includes('wyt');
    return s.done.includes('kuba') ? 6 : hasPlaylist(s) ? 5 : k.cracked ? 4 : k.conn && wyt ? 3 : k.conn ? 2 : s.active === 'kuba' ? 1 : 0;
  },
  onAccept: (s) => {
    const next: GameState = { ...s, mission: { ...s.mission, kuba: { ...s.mission.kuba, bake: drawBake(s.seed) } } };
    return step(next, [{ html: K_ACCEPT_LINE }]);
  },
  appBadges: (s) => (s.active === 'kuba' && !s.owned.includes('wyt') ? ['darknet'] : []),
  hosts: [{
    ip: KUBA_IP,
    name: 'zenek-muzyka',
    promptName: 'zenek',
    access: 'direct',
    usageHint: ' Adres serwera Zenka masz w Notatkach.',
    cracked: (s) => s.mission.kuba.cracked,
    onConnectLocked: kubaConnectLocked,
    onCrack: kubaCrack,
  }],
  commands: KUBA_COMMANDS,
  help: [
    {
      title: 'Podstawowe',
      unlocked: () => true,
      entries: [
        { cmd: 'help', desc: 'lista poleceń w Terminalu', cost: '' },
        { cmd: 'whoami', desc: 'twój pseudonim', cost: '' },
        { cmd: 'clear', desc: 'czyści ekran Terminala', cost: '' },
        { cmd: 'notes', desc: 'otwiera Notatki', cost: '' },
      ],
    },
    {
      title: 'Połączenie',
      unlocked: () => true,
      entries: [
        { cmd: 'connect &lt;ip&gt;', desc: 'łączy z serwerem pod znanym adresem', cost: '1 min gry' },
        { cmd: 'status', desc: 'stan połączenia', cost: '' },
      ],
    },
    {
      title: 'Włamanie',
      unlocked: (s) => s.owned.includes('wyt'),
      need: 'po zakupie Wytrycha w Darknecie',
      entries: [{ cmd: 'crack &lt;ip&gt;', desc: 'otwiera Wytrych: łamie hasło serwera', cost: '1 min gry · w misji 1 bez namierzania' }],
    },
    {
      title: 'Na serwerze',
      unlocked: (s) => s.mission.kuba.cracked,
      need: 'po włamaniu',
      entries: [
        { cmd: 'ls', desc: 'lista plików', cost: '' },
        { cmd: 'cat &lt;plik&gt;', desc: 'podgląd treści pliku', cost: '' },
        { cmd: 'get &lt;plik&gt;', desc: 'pobiera plik do folderu Pobrane', cost: '' },
        { cmd: 'disconnect', desc: 'rozłącza z serwerem', cost: '' },
      ],
    },
  ],
  helpReplacesBase: true,
  hidePrograms: ['NetMap'],
  delivery: { kind: "file" },
  rewards: { money: 300, xp: 80 },
  bonuses: [],
  summary: () => [],
  doneLog: ["> Plik dostarczony: playlista.txt", "> Kuba potwierdził odbiór.", "> Misja 1 zakończona."],
};
