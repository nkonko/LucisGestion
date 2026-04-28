import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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

  loading = false;
  error = '';

  async loginGoogle(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      await this.auth.loginWithGoogle();
      if (this.auth.isLoggedIn()) {
        await this.router.navigate(['/dashboard']);
        return;
      }

      this.error = 'No se pudo completar la sesión. Reintentá.';
      this.loading = false;
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Error al iniciar sesión';
      this.loading = false;
    }
  }
}
