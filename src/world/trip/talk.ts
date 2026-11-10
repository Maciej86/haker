// Rozmowa z przechodniem (wyjazd.tpl.html 359–375). Zmiana względem makiety [decyzja ze specu]:
// „w kamienicy” → „w tym budynku”.
export type TalkKind = 'good' | 'mid' | 'flee';
export type TalkKey = 'start' | 'afterGood' | 'afterMid' | 'last';

export type TalkRound = {
  q: (minute: number) => string;
  o: [TalkKind, string][];
  re: Partial<Record<TalkKind, string>>;
};

export const TALK: Record<TalkKey, TalkRound> = {
  start: {
    q: (t) => (t >= 22 * 60 || t < 5 * 60) ? 'Co pan tu robi w nocy przy tej szafce?' : 'Ej, co pan tu robi przy tej szafce?',
    o: [
      ['good', 'Jestem z serwisu Net-Operator. Mamy zgłoszenie, że w tym budynku nie działa internet, sprawdzam łącze.'],
      ['mid', 'Nic takiego, zaraz kończę i idę.'],
      ['mid', 'Sąsiad z trzeciego piętra prosił, żebym zerknął, bo mu net nie chodzi.'],
      ['flee', 'Ja… nic! Już mnie nie ma.'],
    ],
    re: { good: 'Aha… serwis. No, net to tu ciągle pada.', mid: 'Hm. Zaraz, zaraz…' },
  },
  afterGood: {
    q: () => 'A ma pan coś, że jest z serwisu? Różni się tu kręcą.',
    o: [
      ['good', 'Zlecenie mam w telefonie, proszę: numer 4471-K. Pięć minut i będzie działać.'],
      ['mid', 'Jestem z podwykonawcy, nam nie dają identyfikatorów.'],
      ['mid', 'Niech pan zadzwoni na infolinię Net-Operatora, potwierdzą.'],
      ['flee', 'Nie muszę się panu z niczego tłumaczyć.'],
    ],
    re: { good: '', mid: 'No nie wiem…' },
  },
  afterMid: {
    q: () => 'Sąsiad? Mieszkam tu trzydzieści lat i nikt mi nie mówił. A od kiedy serwis chodzi bez samochodu?',
    o: [
      ['good', 'Auto stoi za rogiem, nie było gdzie zaparkować. Pan też tu nie ma gdzie stanąć, co?'],
      ['mid', 'Mamy teraz cięcia, jeżdżę swoim.'],
      ['mid', 'Nie wiem, ja tylko robię, co mi każą.'],
      ['flee', 'Dobra, nieważne, już sobie idę.'],
    ],
    re: { good: 'Ha, to prawda, tu się nie da zaparkować.', mid: 'Coś mi tu nie pasuje.' },
  },
  last: {
    q: () => 'No dobra… a długo to jeszcze potrwa?',
    o: [
      ['good', 'Pięć minut. Zamknę i nawet pan nie zauważy, że tu byłem.'],
      ['mid', 'Zależy, co znajdę w środku.'],
      ['mid', 'Nie wiem, może godzinę.'],
      ['flee', 'Niech się pan nie wtrąca.'],
    ],
    re: { good: '', mid: '' },
  },
};

export const TALKER = { name: 'Starszy pan z jamnikiem', sub: 'mieszka w tym budynku' };
