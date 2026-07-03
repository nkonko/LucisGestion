import { expect, test } from '@playwright/test';

test('muestra notas del cliente en la lista de clientes', async ({ page }) => {
  await page.goto('/demo/clientes');

  const customerCard = page.locator('.customer-card', { hasText: 'Ana Martínez' });
  await expect(customerCard).toBeVisible();
  await expect(customerCard.getByText('Notas:')).toBeVisible();
  await expect(customerCard.getByText('Siempre pide budín para eventos')).toBeVisible();
});

test('muestra descripción de costo fijo en una línea aparte cuando existe', async ({ page }) => {
  await page.goto('/demo/costos');

  const fixedCostRow = page.locator('.cost-row', { hasText: 'Alquiler del local' });
  await expect(fixedCostRow).toBeVisible();

  const description = fixedCostRow.locator('.cost-row__description');
  await expect(description).toBeVisible();
  await expect(description).toHaveText('Pago el 1 de cada mes');
});
