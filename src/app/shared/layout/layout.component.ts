import { Component, effect, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { PasteleriaStore } from '../../core/store';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
  ],
  template: `
    <mat-toolbar color="primary" class="top-toolbar">
      <span class="text-lg font-medium flex-1">🧁 Lucis Gestión</span>

      <button mat-icon-button [matMenuTriggerFor]="userMenu">
        @if (auth.appUser()?.photoURL) {
          <img [src]="auth.appUser()!.photoURL"
               [alt]="auth.appUser()!.displayName"
               class="avatar"
               referrerpolicy="no-referrer">
        } @else {
          <mat-icon>account_circle</mat-icon>
        }
      </button>
      <mat-menu #userMenu="matMenu">
        <div class="px-4 py-2 border-b">
          <div class="font-medium">{{ auth.appUser()?.displayName }}</div>
          <div class="text-xs text-gray-500">{{ auth.appUser()?.email }}</div>
          <div class="text-xs mt-1">
            <span class="inline-block px-2 py-0.5 rounded-full text-white"
                  [class]="auth.isOwner() ? 'bg-rose-500' : 'bg-blue-500'">
              {{ auth.isOwner() ? 'Dueña' : 'Ayudante' }}
            </span>
          </div>
        </div>
        <button mat-menu-item (click)="logout()">
          <mat-icon>logout</mat-icon>
          <span>Cerrar sesión</span>
        </button>
      </mat-menu>
    </mat-toolbar>

    @if (store.loading()) {
      <div class="global-loading"></div>
    }

    <main class="page-container">
      <router-outlet />
    </main>

    <nav class="bottom-nav">
      <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
        <mat-icon>home</mat-icon>
        <span>Inicio</span>
      </a>
      <a routerLink="/recetas" routerLinkActive="active" class="nav-item">
        <mat-icon>menu_book</mat-icon>
        <span>Recetas</span>
      </a>
      <a routerLink="/ventas" routerLinkActive="active" class="nav-item">
        <mat-icon>point_of_sale</mat-icon>
        <span>Ventas</span>
      </a>
      <a routerLink="/stock" routerLinkActive="active" class="nav-item">
        <mat-icon [matBadge]="stockBajoCount() > 0 ? stockBajoCount() : null"
                  matBadgeColor="warn"
                  matBadgeSize="small">
          inventory_2
        </mat-icon>
        <span>Stock</span>
      </a>
      <a routerLink="/clientes" routerLinkActive="active" class="nav-item">
        <mat-icon>people</mat-icon>
        <span>Clientes</span>
      </a>
    </nav>
  `,
  styles: [`
    .top-toolbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
    }

    main {
      margin-top: 64px;
    }

    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-around;
      align-items: center;
      height: 64px;
      background: var(--mat-sys-surface-container);
      border-top: 1px solid var(--mat-sys-outline-variant);
      z-index: 1000;
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      color: var(--mat-sys-on-surface-variant);
      font-size: 11px;
      padding: 4px 16px;
      border-radius: 16px;
      transition: all 0.2s;
      gap: 2px;

      &.active {
        color: var(--mat-sys-primary);
        font-weight: 500;
      }
    }

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
    }

    .global-loading {
      position: fixed;
      top: 64px;
      left: 0;
      right: 0;
      height: 3px;
      z-index: 999;
      background: linear-gradient(90deg, transparent, var(--mat-sys-primary), transparent);
      background-size: 200% 100%;
      animation: loading-slide 1.2s infinite;
    }

    @keyframes loading-slide {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `],
})
export class LayoutComponent {
  readonly store = inject(PasteleriaStore);
  readonly auth = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  stockBajoCount = this.store.stockBajoCount;

  constructor() {
    effect(() => {
      const error = this.store.error();
      if (error) {
        this.snackBar.open(`Error: ${error}`, 'Cerrar', { duration: 5000, panelClass: 'snackbar-error' });
      }
    });
  }

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}
