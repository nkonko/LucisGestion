import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UiIconComponent } from '../ui/components';

@Component({
  selector: 'app-header',
  imports: [UiIconComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  host: {
    '(document:click)': 'closeMenu()',
  },
})
export class HeaderComponent {
  readonly auth = inject(AuthService);
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
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}