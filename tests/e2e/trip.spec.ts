import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
// JSON przez fs: loader Playwrighta (Node ESM) wymaga atrybutu importu dla .json.
const routes = JSON.parse(readFileSync('src/world/city/trip-routes.json', 'utf8')) as { targetIndex: number };
const startTrip = async (page: Page) => {
  await page.goto('./?dev=1');
  await page.getByRole('button', { name: 'Wyjazd próbny (W., czw 14:08)' }).click();
  const g = page.locator(`svg [data-i="${routes.targetIndex}"]`).first();
  await g.dispatchEvent('pointerdown'); await g.dispatchEvent('pointerup');
  await page.getByRole('button', { name: '▶ Zaplanuj wyjazd tutaj' }).click();
};
test('plan: trzy środki z godzinami i kosztami ze specu', async ({ page }) => {
  await startTrip(page);
  await expect(page.locator('.opt')).toHaveCount(3);
  await expect(page.locator('.opt[data-k="regio"]')).toContainText('odjazd 14:41');
  await expect(page.locator('.opt[data-k="regio"]')).toContainText('46 ¤');
  await expect(page.locator('.opt[data-k="ic"]')).toContainText('odjazd 14:32');
  await expect(page.locator('.opt[data-k="ic"]')).toContainText('74 ¤');
  await expect(page.locator('.opt[data-k="car"]')).toContainText('58 ¤');
  await expect(page.getByText('Paczka od W.')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('cel zlecenia');
});
test('Anuluj wraca do Centrum', async ({ page }) => {
  await startTrip(page);
  await page.getByRole('button', { name: 'Anuluj' }).click();
  await expect(page.getByText('Poznań › Centrum')).toBeVisible();
});
test('przejazd z przyspieszeniem dochodzi na miejsce', async ({ page }) => {
  await startTrip(page);
  await page.locator('.opt[data-k="ic"]').click();
  await page.getByRole('button', { name: 'Jedź' }).click();
  await page.getByRole('button', { name: '⏩ przyspiesz' }).click();
  await expect(page.getByText('▶ normalnie')).toBeVisible();
  await expect(page.getByText(/Jesteś na miejscu/)).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('Kupujesz bilet w automacie: −37 ¤.')).toBeVisible();
});
