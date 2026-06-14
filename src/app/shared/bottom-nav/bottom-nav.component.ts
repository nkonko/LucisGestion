import { Component, inject, Injector, signal } from '@angular/core';
import { computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IngredientsStore } from '../../core/store/ingredients.store';
import { UiIconComponent } from '../ui/components';
import { NavItemComponent } from './nav-item/nav-item.component';
import { DemoModeService } from '../../core/services/demo-mode.service';
import { AuthService } from '../../core/services/auth.service';
import { AuthStore } from '../../core/store/auth.store';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive, UiIconComponent, NavItemComponent],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss',
  host: {
    '(document:click)': 'closeMenu()',
  },
})
export class BottomNavComponent {
  private ingredientsStore = inject(IngredientsStore);
  readonly lowStockCount = this.ingredientsStore.lowStockCount;
  readonly auth = inject(AuthStore);
  private injector = inject(Injector);
  private router = inject(Router);
  private demoMode = inject(DemoModeService);

  readonly menuOpen = signal(false);
  readonly moreMenuOpen = signal(false);
  readonly basePath = computed(() => this.demoMode.isDemoMode() ? '/demo' : '/app');

  closeMenu(): void {
    this.menuOpen.set(false);
    this.moreMenuOpen.set(false);
  }

  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.menuOpen.update((value) => !value);
  }

  toggleMoreMenu(event: Event): void {
    event.stopPropagation();
    this.moreMenuOpen.update((value) => !value);
  }

  onMenuClick(event: Event): void {
    event.stopPropagation();
  }

  navigateToFinancialReports(): void {
    this.menuOpen.set(false);
    this.router.navigate([`${this.basePath()}/reportes-financieros`]);
  }

  navigateToBackupRestore(): void {
    this.menuOpen.set(false);
    this.router.navigate([`${this.basePath()}/backup-restore`]);
  }

  onMoreMenuClick(event: Event): void {
    event.stopPropagation();
  }

  async logout(): Promise<void> {
    this.menuOpen.set(false);
    if (this.demoMode.isDemoMode()) {
      this.auth.setAuthState(null, true);
    } else {
      const authService = this.injector.get(AuthService);
      await authService.logout();
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    this.demoMode.exitDemoMode();
    this.router.navigate(['/']);
  }
}
