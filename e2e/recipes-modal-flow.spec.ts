import { expect, test } from '@playwright/test';

test('flujo del modal de recetas: crear con imagen y eliminar', async ({ page }) => {
  const recipeName = `E2E receta ${Date.now()}`;
  const imageUrl = 'https://example.com/e2e-recipe.jpg';

  await page.goto('/demo/recetas');

  await page.getByRole('button', { name: /Crear receta/i }).click();

  const createDialog = page.getByRole('dialog');
  await expect(createDialog.getByRole('heading', { name: /Nueva receta/i })).toBeVisible();

  await createDialog.getByLabel('Nombre').fill(recipeName);
  await createDialog.getByRole('button', { name: /^Siguiente$/i }).click();

  const ingredientSearch = createDialog.getByLabel('Agregar ingrediente...');
  await ingredientSearch.fill('a');
  await createDialog.getByRole('option').first().click();

  await createDialog.getByRole('button', { name: /^Siguiente$/i }).click();
  await createDialog.getByRole('button', { name: /^Siguiente$/i }).click();

  await createDialog.getByLabel('URL de imagen').fill(imageUrl);
  await createDialog.getByRole('button', { name: /Crear receta/i }).click();

  const createdRecipeCard = page.locator('.recipe-card', { hasText: recipeName });
  await expect(createdRecipeCard).toBeVisible();

  await createdRecipeCard.getByRole('button', { name: /Editar receta/i }).click();

  const editDialog = page.getByRole('dialog');
  await expect(editDialog.getByRole('heading', { name: /Editar receta/i })).toBeVisible();
  await editDialog.getByRole('button', { name: /^Siguiente$/i }).click();
  await editDialog.getByRole('button', { name: /^Siguiente$/i }).click();
  await editDialog.getByRole('button', { name: /^Siguiente$/i }).click();
  await expect(editDialog.getByLabel('URL de imagen')).toHaveValue(imageUrl);

  await editDialog.getByRole('button', { name: /Eliminar receta/i }).click();
  await page.getByRole('button', { name: /^Eliminar$/i }).click();

  await expect(page.locator('.recipe-card', { hasText: recipeName })).toHaveCount(0);
});