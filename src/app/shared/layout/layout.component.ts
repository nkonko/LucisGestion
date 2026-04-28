import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IngredientsStore } from '../../core/store/ingredients.store';
import { AuthService } from '../../core/services/auth.service';
import { UiIconComponent } from '../ui/components';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, UiIconComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  host: {
    '(document:click)': 'closeMenu()',
  },
})
export class LayoutComponent {
  private ingredientsStore = inject(IngredientsStore);
  readonly auth = inject(AuthService);
  private router = inject(Router);

  readonly menuOpen = signal(false);
  readonly lowStockCount = this.ingredientsStore.lowStockCount;

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
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}
