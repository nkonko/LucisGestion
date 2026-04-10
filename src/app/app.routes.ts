import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/layout/layout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'ingredientes',
        loadComponent: () =>
          import('./features/ingredientes/ingredientes.component').then(m => m.IngredientesComponent),
      },
      {
        path: 'recetas',
        loadComponent: () =>
          import('./features/recetas/recetas.component').then(m => m.RecetasComponent),
      },
      {
        path: 'ventas',
        loadComponent: () =>
          import('./features/ventas/ventas.component').then(m => m.VentasComponent),
      },
      {
        path: 'stock',
        loadComponent: () =>
          import('./features/stock/stock.component').then(m => m.StockComponent),
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./features/clientes/clientes.component').then(m => m.ClientesComponent),
      },
      {
        path: 'costos',
        loadComponent: () =>
          import('./features/costos-fijos/costos-fijos.component').then(m => m.CostosFijosComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
