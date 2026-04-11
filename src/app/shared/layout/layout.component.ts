import { Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { IngredientesStore } from '../../core/store/ingredientes.store';
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
  templateUrl: './layout.component.html',
  styles: [
    `
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
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }
    `,
  ],
})
export class LayoutComponent {
  private ingredientesStore = inject(IngredientesStore);
  readonly auth = inject(AuthService);
  private router = inject(Router);

  stockBajoCount = this.ingredientesStore.stockBajoCount;

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}
