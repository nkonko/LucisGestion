import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IngredientsStore } from '../../core/store/ingredients.store';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  private ingredientsStore = inject(IngredientsStore);
  readonly auth = inject(AuthService);
  private router = inject(Router);

  readonly menuOpen = signal(false);
  lowStockCount = this.ingredientsStore.lowStockCount;

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  async logout(): Promise<void> {
    this.closeMenu();
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}
