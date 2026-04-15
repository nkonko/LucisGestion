import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatCardModule, MatProgressSpinnerModule],
  templateUrl: './login.component.html',
  styles: [
    `
      .login-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 24px;
        background: linear-gradient(135deg, #fff1f2, #fff7ed);
      }

      .login-card {
        width: 100%;
        max-width: 360px;
      }

      .google-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        height: 48px;
        font-size: 16px;
      }
    `,
  ],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = false;
  error = '';

  async loginGoogle() {
    this.loading = true;
    this.error = '';
    try {
      await this.auth.loginWithGoogle();
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.error = e?.message ?? 'Error al iniciar sesión';
      this.loading = false;
    }
  }
}
