import { expect, test } from '@playwright/test';

test('nowa gra: pulpit, okna, przeciąganie i zapis po odświeżeniu', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('region', { name: 'Terminal' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Poczta' })).toBeVisible();
  await expect(page.locator('#gclk')).toHaveText('śr 20:30');
  await page.getByRole('navigation', { name: 'Pulpit' }).getByRole('button', { name: /Przeglądarka/ }).click();
  await expect(page.locator('#tasks .task')).toHaveCount(3);
  const bar = page.getByRole('region', { name: 'Terminal' }).locator('.titlebar');
  const before = (await bar.boundingBox())!;
  await page.mouse.move(before.x + 60, before.y + 10); await page.mouse.down();
  await page.mouse.move(before.x + 160, before.y + 60, { steps: 5 }); await page.mouse.up();
  expect(Math.round((await bar.boundingBox())!.x - before.x)).toBe(100);
  // Przeglądarka (200, 96) zasłania przycisk Poczty: najpierw Poczta na wierzch z paska zadań.
  await page.locator('#tasks').getByRole('button', { name: 'Poczta' }).click();
  await page.getByRole('region', { name: 'Poczta' }).getByRole('button', { name: 'Wyślij i przyjmij zlecenie' }).click();
  await page.reload();
  await expect(page.locator('#gclk')).not.toHaveText('śr 20:30');
});
test('motyw z profilu wraca po odświeżeniu', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('neonos-profile', JSON.stringify({ themes: ['fosfor', 'neon'], achievements: [] }));
    localStorage.setItem('neonos-theme', 'neon');
  });
  await page.goto('./'); await expect(page.locator('html')).toHaveAttribute('data-theme', 'neon');
});
test('Zagraj od nowa z menu Start', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('region', { name: 'Poczta' }).getByRole('button', { name: 'Wyślij i przyjmij zlecenie' }).click();
  await page.getByRole('button', { name: '≡ Start' }).click();
  await page.getByRole('button', { name: 'Zagraj od nowa' }).click();
  await page.getByRole('button', { name: 'Tak, od nowa' }).click();
  await expect(page.locator('#gclk')).toHaveText('śr 20:30');
});
test('panel DEV tylko pod ?dev=1', async ({ page }) => {
  await page.goto('./'); await expect(page.getByText('DEV:')).toHaveCount(0);
  await page.goto('./?dev=1'); await expect(page.getByText('DEV:')).toBeVisible();
});
