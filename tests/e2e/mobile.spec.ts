import { expect, test } from '@playwright/test';

const MSG = 'Demo działa na komputerze. Otwórz ten link na komputerze z większym ekranem.';

test('poniżej 1024 px widać komunikat dla telefonu, po poszerzeniu gra wraca', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 700 });
  await page.goto('./');
  await expect(page.getByText(MSG)).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.getByText(MSG)).toBeHidden();
  await expect(page.getByTestId('game')).toBeAttached();
});

test('1024 px to już komputer', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('./');
  await expect(page.getByText(MSG)).toBeHidden();
});
