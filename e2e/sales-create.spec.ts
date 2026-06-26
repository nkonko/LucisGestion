import { expect, test } from '@playwright/test';

test('crea una venta en demo desde el formulario', async ({ page }) => {
  const uniqueNote = `E2E venta ${Date.now()}`;

  await page.goto('/demo/ventas');
  await page.getByRole('button', { name: /Nueva venta/i }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: /Nueva Venta/i })).toBeVisible();

  // Customer selector is a search input with dropdown, not a <select>
  await dialog.getByPlaceholder('Buscar cliente por nombre o teléfono...').fill('Ana');
  await dialog.getByRole('option', { name: /Ana Martínez/i }).click();

  // Cheesecake is in the top 3 best-sellers — add it via the "+" stepper button
  await dialog.getByRole('button', { name: /Agregar unidad de Cheesecake/i }).click();
  await dialog.getByRole('textbox', { name: /^Notas$/i }).fill(uniqueNote);

  await dialog.getByRole('button', { name: /Crear orden/i }).click();

  const createdSaleCard = page.locator('.sale-card', { hasText: uniqueNote });

  await expect(createdSaleCard).toBeVisible();
  await expect(createdSaleCard.getByText('Pendiente')).toBeVisible();
});
