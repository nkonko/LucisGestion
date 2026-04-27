import { Injectable, inject } from '@angular/core';

import { UiToastService } from '../../shared/ui/services/ui-toast.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly toast = inject(UiToastService);

  success(message: string, duration = 2000): void {
    this.toast.show(message, 'success', duration);
  }

  error(message: string, duration = 5000): void {
    this.toast.show(`Error: ${message}`, 'error', duration);
  }

  errorFrom(error: unknown, fallbackMessage: string, duration = 5000): void {
    const message = error instanceof Error ? error.message : fallbackMessage;
    this.error(message, duration);
  }
}
