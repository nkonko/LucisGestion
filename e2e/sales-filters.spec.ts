import { expect, test } from '@playwright/test';

test('filtra ventas por cliente usando buscador', async ({ page }) => {
  await page.goto('/demo/ventas');

  const salesList = page.locator('.sales-list');

  await expect(page.getByRole('heading', { name: /Ventas/i })).toBeVisible();
  await page.getByRole('textbox', { name: /Buscar cliente \/ producto/i }).fill('Carlos Rodríguez');

  await expect(salesList.getByText('Carlos Rodríguez')).toBeVisible();
  await expect(salesList.getByText('Ana Martínez')).toHaveCount(0);
});

test('filtra ventas por estado pendiente', async ({ page }) => {
  await page.goto('/demo/ventas');

  const salesList = page.locator('.sales-list');

  await page.getByRole('combobox', { name: /^Estado$/i }).selectOption('pending');

  await expect(salesList.getByText('Pendiente')).toBeVisible();
  await expect(salesList.getByText('Entregado')).toHaveCount(0);
});
