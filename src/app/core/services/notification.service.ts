import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private snackBar = inject(MatSnackBar);

  success(message: string, duration = 2000): void {
    this.snackBar.open(message, 'OK', { duration });
  }

  error(message: string, duration = 5000): void {
    this.snackBar.open(`Error: ${message}`, 'Cerrar', {
      duration,
      panelClass: 'snackbar-error',
    });
  }
}
