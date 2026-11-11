// Serwer plików centrali Banku Wiślanego (plan 21): drzewo, auth.log, host. Dane 1:1 z mockups/misja.html.
import type { Day } from '../../engine/types';
import { step } from '../../engine/types';
import type { FileEvent, HostDef } from '../../engine/missions';
import { gain } from '../../engine/skills';
import type { Tree, TreeFile, TreeNode } from '../../engine/fstree';
import type { LogLine } from '../../engine/server';
import { startCrack } from '../../engine/server';
import type { GameState, StepResult } from '../../engine/types';

const F = (name: string, mb: number, date: string, author: string, approved: string, notes: string, tag: string, body: string): TreeFile =>
  ({ kind: 'file', name, mb, date, author, approved, notes, tag, body });
const D = (...children: string[]): TreeNode => ({ kind: 'dir', children });

/** FS, linie 1201–1238. tag: ok = właściwy plik; draft/final/copy/sign/old/other/zip/proto = fałszywe tropy; log = auth.log. */
export const W_TREE: Tree = {
  '/': D('archiwum', 'finanse', 'it', 'pracownicy', 'zarzad'),
  '/archiwum': D('kopia_serwera_2026-11-06.zip', 'zestawienie_oddzialow_2026_v2_kopia.xlsx'),
  '/finanse': D('zestawienia', 'faktury', 'budzet_2027_projekt.xlsx'),
  '/finanse/faktury': D('faktury_X_2026.xlsx', 'faktury_IX_2026.xlsx'),
  '/finanse/zestawienia': D('2025', '2026'),
  '/finanse/zestawienia/2025': D('zestawienie_oddzialow_2025.xlsx'),
  '/finanse/zestawienia/2026': D('wersje_robocze', 'zestawienie_oddzialow_2026.xlsx', 'zestawienie_oddzialow_2026_v2.xlsx', 'zestawienie_oddzialow_2026_FINAL.xlsx'),
  '/finanse/zestawienia/2026/wersje_robocze': D('zest_2026_szkic1.xlsx', 'zest_2026_szkic2.xlsx'),
  '/it': D('logi', 'README.txt'),
  '/it/logi': D('auth.log', 'backup.log'),
  '/pracownicy': D('a.wisniewska', 'j.nowak', 'm.kowal'),
  '/pracownicy/a.wisniewska': D('plan_urlopow_IV_kw.xlsx', 'sernik.txt'),
  '/pracownicy/j.nowak': D('zestawienie_do_podpisu.xlsx', 'notatka.txt'),
  '/pracownicy/m.kowal': D('lista_zakupow.txt'),
  '/zarzad': D('protokoly'),
  '/zarzad/protokoly': D('protokol_2026-09-22.pdf', 'protokol_2026-10-20.pdf'),
  '/archiwum/kopia_serwera_2026-11-06.zip': F("kopia_serwera_2026-11-06.zip", 48, "2026-11-06", "backup", "—", "nocna kopia całego serwera", "zip", "[archiwum zip, 48 MB, podgląd niedostępny]"),
  '/archiwum/zestawienie_oddzialow_2026_v2_kopia.xlsx': F("zestawienie_oddzialow_2026_v2_kopia.xlsx", 2.4, "2026-10-19", "M. Kowal", "—", "kopia przed posiedzeniem zarządu", "copy", "Zestawienie oddziałów 2026 · wersja przed uchwałą\nOddziałów: 41 · Poznań-Centrum, Gniezno, Leszno, Piła…"),
  '/finanse/budzet_2027_projekt.xlsx': F("budzet_2027_projekt.xlsx", 3.1, "2026-11-02", "J. Nowak", "—", "projekt, nie rozsyłać", "other", "Budżet 2027 · projekt\nPrzychody… Koszty…"),
  '/finanse/faktury/faktury_X_2026.xlsx': F("faktury_X_2026.xlsx", 0.9, "2026-11-03", "księgowość", "—", "", "other", "Faktury październik 2026"),
  '/finanse/faktury/faktury_IX_2026.xlsx': F("faktury_IX_2026.xlsx", 0.8, "2026-10-02", "księgowość", "—", "", "other", "Faktury wrzesień 2026"),
  '/finanse/zestawienia/2025/zestawienie_oddzialow_2025.xlsx': F("zestawienie_oddzialow_2025.xlsx", 1.8, "2025-12-30", "M. Kowal", "J. Nowak", "uchwała zarządu 3/2025", "old", "Zestawienie oddziałów 2025\nOddziałów: 38"),
  '/finanse/zestawienia/2026/zestawienie_oddzialow_2026.xlsx': F("zestawienie_oddzialow_2026.xlsx", 2.1, "2026-11-05", "M. Kowal", "—", "poprawki po uchwale, NIE ZATWIERDZONE", "draft", "Zestawienie oddziałów 2026 · robocze\n[zmiany po 20.10 oznaczone na żółto]"),
  '/finanse/zestawienia/2026/zestawienie_oddzialow_2026_v2.xlsx': F("zestawienie_oddzialow_2026_v2.xlsx", 2.4, "2026-10-20", "M. Kowal", "J. Nowak (dyr. finansowy)", "przyjęte uchwałą zarządu 14/2026", "ok", "Zestawienie oddziałów 2026\nOddziałów: 42 · Poznań-Centrum, Gniezno, Leszno, Piła, Konin…\nZatwierdzono: J. Nowak, 20.10.2026"),
  '/finanse/zestawienia/2026/zestawienie_oddzialow_2026_FINAL.xlsx': F("zestawienie_oddzialow_2026_FINAL.xlsx", 2.3, "2026-10-14", "A. Wiśniewska", "—", "do akceptacji dyr. Nowak", "final", "Zestawienie oddziałów 2026 FINAL\nOddziałów: 40"),
  '/finanse/zestawienia/2026/wersje_robocze/zest_2026_szkic1.xlsx': F("zest_2026_szkic1.xlsx", 1.2, "2026-09-08", "M. Kowal", "—", "szkic", "draft", "szkic 1"),
  '/finanse/zestawienia/2026/wersje_robocze/zest_2026_szkic2.xlsx': F("zest_2026_szkic2.xlsx", 1.6, "2026-09-30", "M. Kowal", "—", "szkic po uwagach działu", "draft", "szkic 2"),
  '/it/README.txt': F("README.txt", 0.01, "2025-03-11", "admin", "—", "", "other", "Logi logowań: /it/logi/auth.log\nLogi czyścimy co kwartał. Nie usuwać ręcznie!"),
  '/it/logi/auth.log': F("auth.log", 0.02, "dziś", "system", "—", "dziennik logowań do serwera", "log", ""),
  '/it/logi/backup.log': F("backup.log", 0.05, "dziś", "backup", "—", "", "other", "01:00 kopia nocna OK\n03:12 kopia nocna zakończona"),
  '/pracownicy/a.wisniewska/plan_urlopow_IV_kw.xlsx': F("plan_urlopow_IV_kw.xlsx", 0.6, "2026-10-02", "A. Wiśniewska", "—", "", "other", "Plan urlopów IV kw."),
  '/pracownicy/a.wisniewska/sernik.txt': F("sernik.txt", 0.01, "2026-06-14", "A. Wiśniewska", "—", "", "other", "Sernik babci Heli: 1 kg twarogu, 6 jaj…"),
  '/pracownicy/j.nowak/zestawienie_do_podpisu.xlsx': F("zestawienie_do_podpisu.xlsx", 2.4, "2026-10-18", "M. Kowal", "—", "do podpisu przed posiedzeniem 20.10", "sign", "Zestawienie oddziałów 2026 · do podpisu"),
  '/pracownicy/j.nowak/notatka.txt': F("notatka.txt", 0.01, "2026-10-21", "J. Nowak", "—", "", "other", "Podpisane. Ostateczna wersja w finansach jako v2.\nFINAL od Ani NIE przeszło, poprawić do grudnia."),
  '/pracownicy/m.kowal/lista_zakupow.txt': F("lista_zakupow.txt", 0.01, "2026-11-07", "M. Kowal", "—", "", "other", "mleko, chleb, toner do drukarki (znowu)"),
  '/zarzad/protokoly/protokol_2026-09-22.pdf': F("protokol_2026-09-22.pdf", 0.4, "2026-09-22", "sekretariat", "—", "", "proto", "Protokół posiedzenia zarządu 22.09.2026\nZestawienie oddziałów 2026: odesłane do poprawek."),
  '/zarzad/protokoly/protokol_2026-10-20.pdf': F("protokol_2026-10-20.pdf", 0.4, "2026-10-20", "sekretariat", "—", "", "proto", "Protokół posiedzenia zarządu 20.10.2026\nUchwała 14/2026: zarząd przyjmuje zestawienie oddziałów 2026\n(plik zestawienie_oddzialow_2026_v2.xlsx, oprac. M. Kowal).\nPodpisała: dyr. finansowa J. Nowak."),
};

/** Wpisy banku w auth.log z dnia `day` (linie 1270–1272). */
export function wBankLog(day: Day): LogLine[] {
  return [
    ' 07:58  a.wisniewska  10.42.7.5    logowanie OK',
    ' 08:03  m.kowal       10.42.7.6    logowanie OK',
    ' 09:41  j.nowak       10.42.7.6    logowanie OK',
    ' 12:47  backup        10.42.7.31   zadanie: pomiń',
    ' 14:15  m.kowal       10.42.7.6    zmiana: zestawienie_oddzialow_2026.xlsx',
  ].map((t, id) => ({ id, t: day + t }));
}

/** Serwer plików centrali: wejście tylko przez S1 i Wytrycha. */
export const W_HOST: HostDef = {
  ip: '10.42.7.12',
  name: 'serwer plików centrali',
  access: 'S1',
  flat: false,
  tree: W_TREE,
  enterCmd: 'crack 10.42.7.12',
  cracked: () => false,
  onConnectLocked: (s) => step(s),
  onCrack: (s) => wOnCrack(s),
  onFile: (s, ev) => wOnFile(s, ev),
};

/** Zejście z serwera: flaga misji; z plikiem W. w Pobranych +0,3 Linux (linia 957). */
export function wOnFile(s: GameState, ev: FileEvent): StepResult {
  if (ev.cmd !== 'disconnect') return step(s);
  const n: GameState = { ...s, mission: { ...s.mission, w: { ...s.mission.w, disc: true } } };
  if (!n.downloads.some((f) => f.mission === 'w')) return step(n);
  return gain(n, 'Linux', 0.3, 'pobranie i czyste rozłączenie');
}

/** `crack 10.42.7.12`: dopiero po znalezieniu celu (linia 926 bez „Najpierw znajdź cel (scan, probe).”). */
export function wOnCrack(s: GameState): StepResult {
  if (!s.mission.w.found) return step(s, [{ html: '<span class="r">Nie wiesz jeszcze, do czego się włamać.</span>' }]);
  return startCrack(s, W_HOST.ip);
}
