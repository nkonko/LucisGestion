import { Injectable, computed, signal } from '@angular/core';

import { UiToastItem } from '../models/ui-toast-item.model';
import { UiToastKind } from '../models/ui-toast-kind.model';

const DISMISS_ANIMATION_MS = 350;

@Injectable({ providedIn: 'root' })
export class UiToastService {
  private readonly toastList = signal<UiToastItem[]>([]);
  readonly toasts = computed(() => this.toastList());

  show(message: string, kind: UiToastKind, duration: number, icon?: string): string {
    const id = crypto.randomUUID();
    const toast: UiToastItem = { id, message, kind, duration, icon };

    this.toastList.update((current) => [...current, toast]);

    window.setTimeout(() => {
      this.dismiss(id);
    }, duration);

    return id;
  }

  dismiss(id: string): void {
    this.toastList.update((current) =>
      current.map((t) => (t.id === id ? { ...t, dismissing: true } : t)),
    );
    window.setTimeout(() => {
      this.toastList.update((current) => current.filter((t) => t.id !== id));
    }, DISMISS_ANIMATION_MS);
  }

  clear(): void {
    this.toastList.set([]);
  }
}
