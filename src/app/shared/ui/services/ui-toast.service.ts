import { Injectable, computed, signal } from '@angular/core';

import { UiToastItem } from '../models/ui-toast-item.model';
import { UiToastKind } from '../models/ui-toast-kind.model';

@Injectable({ providedIn: 'root' })
export class UiToastService {
  private readonly toastList = signal<UiToastItem[]>([]);
  readonly toasts = computed(() => this.toastList());

  show(message: string, kind: UiToastKind, duration: number): string {
    const id = crypto.randomUUID();
    const toast: UiToastItem = { id, message, kind, duration };

    this.toastList.update((current) => [...current, toast]);

    window.setTimeout(() => {
      this.dismiss(id);
    }, duration);

    return id;
  }

  dismiss(id: string): void {
    this.toastList.update((current) => current.filter((toast) => toast.id !== id));
  }

  clear(): void {
    this.toastList.set([]);
  }
}
