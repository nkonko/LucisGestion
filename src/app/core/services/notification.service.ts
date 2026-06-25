import { Injectable, inject } from '@angular/core';

import { getErrorMessage } from '../utils/error.utils';
import { UiToastService } from '../../shared/ui/services/ui-toast.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly toast = inject(UiToastService);

  success(message: string, duration = 2000): void {
    this.toast.show(message, 'success', duration, '✓');
  }

  error(message: string, duration = 5000): void {
    this.toast.show(`Error: ${message}`, 'error', duration, '✕');
  }

  errorFrom(error: unknown, fallbackMessage: string, duration = 5000): void {
    const message = getErrorMessage(error, fallbackMessage);
    this.error(message, duration);
  }

  info(message: string, duration = 4000): void {
    this.toast.show(message, 'info', duration, 'ℹ');
  }
}
