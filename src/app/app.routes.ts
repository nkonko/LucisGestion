import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/layout/layout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'ingredientes',
        loadComponent: () =>
          import('./features/ingredients/ingredients.component').then(
            (m) => m.IngredientsComponent,
          ),
      },
      {
        path: 'recetas',
        loadComponent: () =>
          import('./features/recipes/recipes.component').then((m) => m.RecipesComponent),
      },
      {
        path: 'ventas',
        loadComponent: () =>
          import('./features/sales/sales.component').then((m) => m.SalesComponent),
      },
      {
        path: 'stock',
        loadComponent: () =>
          import('./features/stock/stock.component').then((m) => m.StockComponent),
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./features/customers/customers.component').then((m) => m.CustomersComponent),
      },
      {
        path: 'costos',
        loadComponent: () =>
          import('./features/fixed-costs/fixed-costs.component').then(
            (m) => m.FixedCostsComponent,
          ),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
