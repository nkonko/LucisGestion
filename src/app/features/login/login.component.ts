import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal('');

  async loginGoogle(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      await this.auth.loginWithGoogle();
      await this.router.navigate(['/dashboard']);
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'Error al iniciar sesión');
      this.loading.set(false);
    }
  }
}
