import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
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
