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
  template: `
    <div class="login-container">
      <div class="text-center mb-8">
        <div class="text-5xl mb-4">🧁</div>
        <h1 class="text-2xl font-bold text-rose-600">Lucis Gestión</h1>
        <p class="text-gray-500 mt-2">Gestión de pastelería</p>
      </div>

      <mat-card class="login-card">
        <mat-card-content class="py-6 text-center">
          @if (loading) {
            <mat-spinner diameter="40" class="mx-auto mb-4"></mat-spinner>
            <p class="text-gray-500">Iniciando sesión...</p>
          } @else {
            <p class="text-gray-600 mb-6">Iniciá sesión para continuar</p>

            <button mat-flat-button class="google-btn w-full" (click)="loginGoogle()">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                   alt="" width="20" height="20" class="mr-2">
              Continuar con Google
            </button>

            @if (error) {
              <p class="text-red-500 text-sm mt-4">{{ error }}</p>
            }
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
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
  `],
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
