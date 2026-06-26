import { expect, test } from '@playwright/test';

test('abre menu de cuenta y navega a reportes financieros', async ({ page }) => {
  await page.goto('/demo/dashboard');

  await page.getByRole('button', { name: /Abrir men. de usuario/i }).click();
  await page.getByRole('menuitem', { name: /Reportes financieros/i }).click();

  await expect(page).toHaveURL(/\/demo\/reportes-financieros/);
  await expect(page.getByRole('heading', { name: /Reportes financieros/i })).toBeVisible();
});

test('abre menu de cuenta y navega a backup y restore', async ({ page }) => {
  await page.goto('/demo/dashboard');

  await page.getByRole('button', { name: /Abrir men. de usuario/i }).click();
  await page.getByRole('menuitem', { name: /Backup y restore/i }).click();

  await expect(page).toHaveURL(/\/demo\/backup-restore/);
  await expect(page.getByRole('heading', { name: /Backup y restore/i })).toBeVisible();
});
