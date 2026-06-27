import { expect, test } from '@playwright/test';

test('navega con barra inferior en demo', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Ver demo/i }).click();

  await expect(page).toHaveURL(/\/demo\/dashboard/);

  const bottomNav = page.getByRole('navigation');

  await bottomNav.getByRole('link', { name: /^Recetas$/i }).click();
  await expect(page).toHaveURL(/\/demo\/recetas/);
  await expect(page.getByRole('heading', { name: /Recetas/i })).toBeVisible();

  await bottomNav.getByRole('link', { name: /^Ventas$/i }).click();
  await expect(page).toHaveURL(/\/demo\/ventas/);
  await expect(page.getByRole('heading', { name: /Ventas/i })).toBeVisible();

  await bottomNav.getByRole('link', { name: /Stock$/i }).click();
  await expect(page).toHaveURL(/\/demo\/stock/);
  await expect(page.getByRole('heading', { name: /^Stock$/i })).toBeVisible();

  await bottomNav.getByRole('link', { name: /^Inicio$/i }).click();
  await expect(page).toHaveURL(/\/demo\/dashboard/);
  await expect(page.getByRole('heading', { name: /Usuario Demo/i })).toBeVisible();
});
