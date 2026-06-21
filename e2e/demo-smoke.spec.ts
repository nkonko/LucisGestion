import { expect, test } from '@playwright/test';

const demoRoutes = [
  { path: '/demo/dashboard', heading: /Hola!/i },
  { path: '/demo/ingredientes', heading: /Ingredientes/i },
  { path: '/demo/recetas', heading: /Recetas/i },
  { path: '/demo/ventas', heading: /Ventas/i },
  { path: '/demo/stock', heading: /^Stock$/i },
  { path: '/demo/clientes', heading: /Clientes/i },
  { path: '/demo/costos', heading: /Costos fijos/i },
  { path: '/demo/reportes-financieros', heading: /Reportes financieros/i },
  { path: '/demo/backup-restore', heading: /Backup y restore/i },
] as const;

for (const routeCase of demoRoutes) {
  test(`carga ${routeCase.path}`, async ({ page }) => {
    await page.goto(routeCase.path);

    await expect(page).toHaveURL(new RegExp(routeCase.path));
    await expect(page.getByRole('heading', { name: routeCase.heading })).toBeVisible();
  });
}
