import { expect, test } from '@playwright/test';

test('reingresa al dashboard demo sin refresh manual', async ({ page }) => {
  await page.goto('/demo/dashboard');

  await expect(page).toHaveURL(/\/demo\/dashboard/);
  await expect(page.getByRole('heading', { name: /Usuario Demo/i })).toBeVisible();

  await page.getByRole('button', { name: /Abrir men. de usuario/i }).click();
  await page.getByRole('menuitem', { name: /Cerrar sesión/i }).click();

  await expect(page).toHaveURL('/');

  await page.getByRole('link', { name: /Ver demo/i }).click();

  await expect(page).toHaveURL(/\/demo\/dashboard/);
  await expect(page.getByRole('heading', { name: /Usuario Demo/i })).toBeVisible();
});
