import { test, expect, type Page } from '@playwright/test';
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
