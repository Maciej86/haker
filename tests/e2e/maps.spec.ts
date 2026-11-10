import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
// JSON przez fs: loader Playwrighta (Node ESM) wymaga atrybutu importu dla .json.
const routes = JSON.parse(readFileSync('src/world/city/trip-routes.json', 'utf8')) as { targetIndex: number };
const jump = async (page: Page, label: string) => { await page.goto('./?dev=1'); await page.getByRole('button', { name: label }).click(); };

test('mapa Polski: Poznań otwiera mapę miasta, lotnisko i Opalenica niedostępne', async ({ page }) => {
  await jump(page, 'Po Kubie, bez zlecenia (czw 13:50)');
  await expect(page.getByText('brak przyjętego zlecenia')).toBeVisible();
  await expect(page.getByText('oglądanie mapy nie zużywa czasu')).toBeVisible();
  // Małe miejscowości (LOD) pokazują się dopiero po przybliżeniu: kółko nad Nowym Tomyślem.
  const nt = (await page.locator('.city[data-i]').filter({ hasText: 'Nowy Tomyśl' }).boundingBox())!;
  await page.mouse.move(nt.x + nt.width - 4, nt.y + nt.height / 2);
  for (let k = 0; k < 6; k++) await page.mouse.wheel(0, -100);
  await page.locator('.city[data-i]').filter({ hasText: 'Opalenica' }).hover();
  await expect(page.getByText('▸ niedostępne w demo')).toBeVisible();
  await page.locator('.city[data-a="6"]').hover();                 // AIRPORTS[6] = Poznań
  await expect(page.getByText('niedostępne w demo')).toBeVisible();
  await page.locator('.city[data-i]').filter({ hasText: 'Poznań' }).click();
  await expect(page.getByRole('button', { name: /Poznań/ })).toHaveClass(/on/);
});
test('✕ wróć na pulpit', async ({ page }) => {
  await jump(page, 'Po Kubie, bez zlecenia (czw 13:50)');
  await page.getByText('✕ wróć na pulpit').click();
  // Korzeń pulpitu ma zerowy rozmiar (dzieci są pozycjonowane), więc widoczność sprawdzamy na zegarze.
  await expect(page.locator('[data-screen="desktop"]')).toHaveCount(1);
  await expect(page.locator('#gclk')).toBeVisible();
});
const clickBuilding = async (page: Page, i: number) => {
  const g = page.locator(`svg [data-i="${i}"]`).first();
  await g.dispatchEvent('pointerdown'); await g.dispatchEvent('pointerup');
};
test('Centrum: cel niewidoczny, bez zlecenia komunikat', async ({ page }) => {
  await jump(page, 'Po Kubie, bez zlecenia (czw 13:50)');
  await page.locator('.city[data-i]').filter({ hasText: 'Poznań' }).click();
  await page.locator('.dist[data-d="centrum"]').dispatchEvent('click');
  await expect(page.getByText('Poznań › Centrum')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('cel zlecenia');
  await expect(page.getByText('◎ pokaż cel')).toHaveCount(0);
  await clickBuilding(page, routes.targetIndex);
  await page.getByRole('button', { name: '▶ Zaplanuj wyjazd tutaj' }).click();
  await expect(page.getByText('Najpierw przyjmij zlecenie w Poczcie.')).toBeVisible();
});
test('inny budynek: komunikat zamiast wyjazdu', async ({ page }) => {
  await jump(page, 'Wyjazd próbny (W., czw 14:08)');
  await clickBuilding(page, routes.targetIndex === 0 ? 1 : 0);
  await page.getByRole('button', { name: '▶ Zaplanuj wyjazd tutaj' }).click();
  await expect(page.getByText('Tu nie ma nic, co pomoże w zleceniu.')).toBeVisible();
});
test('wieżowiec celu: karta z Hotelem Luksus i wyjazd', async ({ page }) => {
  await jump(page, 'Wyjazd próbny (W., czw 14:08)');
  await clickBuilding(page, routes.targetIndex);
  await expect(page.getByText('Hotel Luksus')).toBeVisible();
  await page.getByRole('button', { name: '▶ Zaplanuj wyjazd tutaj' }).click();
  await expect(page.getByText('⛟ WYJAZD W TEREN')).toBeVisible();
});
