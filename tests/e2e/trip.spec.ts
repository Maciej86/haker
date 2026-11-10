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
const drag = async (page: Page, from: string, to: string) => {
  const a = await page.locator(from).boundingBox(), b = await page.locator(to).boundingBox();
  await page.mouse.move(a!.x + a!.width / 2, a!.y + a!.height / 2); await page.mouse.down();
  await page.mouse.move(b!.x + b!.width / 2, b!.y + b!.height / 2, { steps: 8 }); await page.mouse.up();
};
const toSite = async (page: Page) => {
  await startTrip(page);
  await page.locator('.opt[data-k="ic"]').click();
  await page.getByRole('button', { name: 'Jedź' }).click();
  await page.getByRole('button', { name: '⏩ przyspiesz' }).click();
};
test('pełny wyjazd: gładka rozmowa, podsłuch przy S1, zapis po powrocie', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await toSite(page);
  await page.getByRole('button', { name: '▶ Idź na przystanek po paczkę' }).click({ timeout: 15000 });
  await page.getByRole('button', { name: '▶ Rozejrzyj się' }).click({ timeout: 5000 });
  await drag(page, '.it[data-k="key"]', '.cabinet .door-lock');
  await page.getByRole('button', { name: /Jestem z serwisu Net-Operator/ }).click({ timeout: 5000 });
  await page.getByRole('button', { name: '▶ Dalej' }).click();
  await page.getByRole('button', { name: /Zlecenie mam w telefonie/ }).click();
  await expect(page.getByText('+0,6 Social · wybrnięte gładko')).toBeVisible();
  await page.getByRole('button', { name: '▶ Wróć do szafki' }).click();
  await drag(page, '.it[data-k="key"]', '.cabinet .door-lock');           // zły przedmiot: nic się nie dzieje
  await expect(page.locator('.drag-hint.shake')).toBeVisible();
  await drag(page, '.it[data-k="dev"]', '.cabinet .slot');
  await drag(page, '.it[data-k="phone"]', '.cabinet .dev-rect');
  await expect(page.getByText('● PODSŁUCH-1 połączony')).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: '▶ Zamknij szafkę' }).click();
  await page.getByRole('button', { name: '▶ Odejdź spokojnie' }).click({ timeout: 5000 });
  await expect(page.getByText('Wyjazd zakończony', { exact: true })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('PODSŁUCH-1 online przy S1 · 60 min pracy')).toBeVisible();
  await page.getByRole('button', { name: 'Wróć do komputera' }).click();
  const save = await page.evaluate(() => JSON.parse(localStorage.getItem('neonos-save')!));
  expect(save.screen).toBe('desktop');
  expect(save.devices).toEqual([{ id: 'bug1', where: 'S1', minutes: 60 }]);
  expect(save.money).toBe(400 - 74);
  // ekspres 14:32, na miejscu 15:15 + 11 min (paczka 3, rozejrzenie 1, szafka 1, 2 rundy, podpięcie 2, test 1, zamknięcie 1),
  // powrót 15:58 → 16:28 + 17 min dojścia = 16:45, czyli tripOutcome(...).end
  expect(save.t).toBe(16 * 60 + 45);
  expect(errors).toEqual([]);
});
test('ucieczka: powrót z podsłuchem w plecaku, drugi wyjazd bez paczki', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await toSite(page);
  await page.getByRole('button', { name: '▶ Idź na przystanek po paczkę' }).click({ timeout: 15000 });
  await page.getByRole('button', { name: '▶ Rozejrzyj się' }).click({ timeout: 5000 });
  await drag(page, '.it[data-k="key"]', '.cabinet .door-lock');
  await page.getByRole('button', { name: /Ja… nic! Już mnie nie ma\./ }).click({ timeout: 5000 });
  await page.getByRole('button', { name: '▶ Uciekaj' }).click();
  await expect(page.getByText('Wyjazd zakończony ucieczką', { exact: true })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('PODSŁUCH-1 w plecaku, nie podpięty')).toBeVisible();
  await page.getByRole('button', { name: 'Wróć do komputera' }).click();
  const save = await page.evaluate(() => JSON.parse(localStorage.getItem('neonos-save')!));
  expect(save.devices).toEqual([{ id: 'bug1', where: 'plecak', minutes: 60 }]);
  expect(save.trip.last).toBe('fled');
  expect(save.t).toBe(16 * 60 + 45);
  expect(errors).toEqual([]);
});
test('odświeżenie w trakcie wyjazdu wraca na mapę bez kosztów', async ({ page }) => {
  await toSite(page);
  await page.reload();
  await expect(page.getByText('Poznań › Centrum')).toBeVisible();
  const save = await page.evaluate(() => JSON.parse(localStorage.getItem('neonos-save')!));
  expect(save.money).toBe(400);
});
