export const KUBA_IP = '83.21.40.17';

export const K_NOTHERE =
  `<span class="d">Tego teraz nie potrzebujesz. Znasz IP serwera Zenka, więc łączysz się wprost: connect ${KUBA_IP}.\nSkanowanie okolicy wymaga urządzenia przy antenie albo skrzynce operatora. Poznasz je w kolejnych zleceniach.</span>`;

export const K_FLAT = '<span class="d">Serwer Zenka to płaska lista plików. Wystarczą ls, cat i get.</span>';

const HELP_HEAD = '<span class="c">Dostępne polecenia</span>\n  connect &lt;ip&gt;      połącz z serwerem pod znanym adresem\n  status            stan połączenia';
const HELP_CRACK = '\n  crack &lt;ip&gt;        włamanie: Wytrych łamie hasło serwera';
const HELP_TAIL = `
  ls                lista plików (na serwerze albo w Pobranych)
  cat &lt;plik&gt;        podgląd pliku
  get &lt;plik&gt;        pobierz plik do folderu Pobrane
  disconnect        rozłącz z serwerem
  notes             otwórz Notatki
  whoami, clear
<span class="d">Pełny spis z opisami: Ściąga na pulpicie.</span>`;

/** Treść `help` w Terminalu: bez linii crack i z nią (po zakupie Wytrycha). */
export const K_HELP_TERM = {
  plain: HELP_HEAD + HELP_TAIL,
  withCrack: HELP_HEAD + HELP_CRACK + HELP_TAIL,
};

export const K_DONE_REPLY = 'Jest! Sobota uratowana. Przelew poszedł. Zenek dalej nie wie, co się stało.';

export const K_WRONG: Record<string, string> = {
  'przepis_na_paczki.txt': 'Pączki? Brzmi smacznie, ale chodziło o playlistę :)',
  'zamowienia_sobota.txt': 'Hah, widzę swoje 20 pączków. Ale potrzebuję playlisty!',
  'podpowiedz_hasla.txt': 'Zenek i jego zagadki… Wyślij mi playlistę.',
};

export const K_NOTE_HTML =
  `Naprawiałem Zenkowi Wi-Fi na zapleczu. Muzykę puszcza z domowego serwerka. Adres serwerka: <b style="color:var(--acc)">${KUBA_IP}</b>. Hasła nie podał.`;

export const K_ACCEPT_LINE = '<span class="d">Kuba odpisał. IP serwera Zenka masz w Notatkach.</span>';
