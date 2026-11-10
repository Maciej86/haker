<div align="center">

```
 >_ NeonOS
```

# haker

**Przeglądarkowa gra o hakerze z Nowego Tomyśla.**
Poczta od zleceniodawców, terminal, mapa Polski, wyjazdy w teren i łamigłówki z zegarem w tle.

`status: w budowie` · `demo: wkrótce na GitHub Pages`

</div>

---

## O co chodzi

Siedzisz przy swoim komputerze z systemem **NeonOS**. W Poczcie przychodzą zlecenia: od kumpla, od nieznajomego, czasem dwa naraz. Zlecenie mówi tylko, **co** ma się stać. **Jak** to zrobić, to już Twoja głowa.

- 📨 **Poczta**: czytasz zlecenie, odpowiadasz, odsyłasz pliki jako załączniki.
- ⌨️ **Terminal**: wpisujesz polecenia (`scan`, `ls`, `get`…), a programy graficzne rysują ich wynik.
- 🗺️ **Mapa**: Polska, miasta i dzielnice w izometrii. Cel trzeba znaleźć bez podpowiedzi, mapa go nie zdradza.
- 🚆 **Wyjazd w teren**: pociąg, ekspres albo samochód. Rozkład jazdy, bilety i termin, który się nie przesunie.
- 🧩 **Łamigłówki**: każde zabezpieczenie to inna zagadka, czasem z namierzaniem, które rośnie z każdą sekundą.
- ⏱️ **Okna czasowe**: niektóre rzeczy muszą się stać o konkretnej minucie.
- 📈 **Umiejętności rosną od używania**: rozmowy rozwijają Social, terminal rozwija Linux, dedukcja rozwija Sieć.

Czas w grze płynie od akcji, a nie od zegarka na ścianie. Myślenie jest darmowe, działanie kosztuje.

> Wszystkie polecenia, hosty, firmy i adresy są **fikcyjne i uproszczone**. To gra logiczna, a nie poradnik.

## Demo

Pierwsze demo to trzy zlecenia na trzy dni gry: krótki start od Kuby, a potem dwie oferty, z których naraz można prowadzić tylko jedną.

🔗 Link pojawi się tutaj po pierwszym wdrożeniu.

Demo działa na komputerze (Chrome, Firefox, Edge). Na telefonie pokaże tylko prośbę o otwarcie na większym ekranie.

## Wygląd

Motyw **Fosfor**: turkusowy fosfor na grafitowym tle, JetBrains Mono, płaskie okna z cienką ramką. Za ukończone misje odblokowujesz kolejne motywy: **Neon**, **Bursztyn** i **Halo Systems**.

## Technologia

| | |
|---|---|
| Front | React + TypeScript, Vite |
| UI | własne komponenty na tokenach motywu, bez bibliotek UI |
| Stan gry | w przeglądarce (`localStorage`), bez serwera |
| Misje | dane w osobnych plikach, jeden wspólny silnik |
| Testy | Vitest (silnik gry), Playwright (przejście demo) |
| Hosting | GitHub Pages, wdrożenie przez GitHub Actions |

## Uruchomienie lokalnie

Wymagany Node.js 20 lub nowszy.

```bash
npm install
npm run dev      # serwer deweloperski
npm test         # testy silnika
npm run build    # wersja produkcyjna do dist/
```

## Plany

Jeśli demo się spodoba: serwer i konta graczy, więcej misji i miast, własne programy pisane przez graczy, handel w Darknecie i misje we dwójkę.
