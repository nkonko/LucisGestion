import { Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { IngredientsStore } from '../../core/store/ingredients.store';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-layout',
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
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  private ingredientsStore = inject(IngredientsStore);
  readonly auth = inject(AuthService);
  private router = inject(Router);

  lowStockCount = this.ingredientsStore.lowStockCount;

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}
