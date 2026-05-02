import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IngredientsStore } from '../../core/store/ingredients.store';
import { UiIconComponent } from '../ui/components';
import { AuthService } from '../../core/services/auth.service';
import { AuthStore } from '../../core/store/auth.store';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive, UiIconComponent],
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
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly menuOpen = signal(false);

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.menuOpen.update((value) => !value);
  }

  onMenuClick(event: Event): void {
    event.stopPropagation();
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
