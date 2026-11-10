import { expect, test } from '@playwright/test';

test('strona gry się ładuje bez błędów w konsoli', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('./');
  await expect(page).toHaveTitle('NeonOS');
  await expect(page.getByTestId('game')).toBeAttached();
  expect(errors).toEqual([]);
});
