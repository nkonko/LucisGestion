import { expect, test } from '@playwright/test';

test('navega desde landing al dashboard demo', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Lucis Gesti.n/);

  await expect(page.getByRole('heading', { name: /Control total de tu operacion/i })).toBeVisible();

  await page.getByRole('link', { name: /Ver demo/i }).click();

  await expect(page).toHaveURL(/\/demo\/dashboard/);
  await expect(page.getByRole('heading', { name: /Usuario Demo/i })).toBeVisible();
});
