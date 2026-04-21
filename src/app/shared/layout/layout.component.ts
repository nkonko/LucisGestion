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
  styleUrl: './layout.component.scss',
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
