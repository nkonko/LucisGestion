import { ApplicationRef, Injectable, InjectionToken, inject } from '@angular/core';
import {
  SwUpdate,
  VersionReadyEvent,
} from '@angular/service-worker';
import { filter, first, interval } from 'rxjs';
import { NotificationService } from './notification.service';

export const APP_RELOAD = new InjectionToken<() => void>('App reload function', {
  providedIn: 'root',
  factory: () => () => { window.location.reload(); },
});

@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private updates = inject(SwUpdate);
  private appRef = inject(ApplicationRef);
  private notify = inject(NotificationService);
  private reloadApp = inject(APP_RELOAD);

  constructor() {
    if (!this.updates.isEnabled) {
      return;
    }

    this.updates.versionUpdates
      .pipe(
        filter(
          (event): event is VersionReadyEvent =>
            event.type === 'VERSION_READY',
        ),
      )
      .subscribe(() => {
        void this.activateAndReload();
      });

    this.appRef.isStable.pipe(first(Boolean)).subscribe(() => {
      void this.updates.checkForUpdate();

      interval(6 * 60 * 60 * 1000).subscribe(() => {
        void this.updates.checkForUpdate();
      });
    });
  }

  private async activateAndReload(): Promise<void> {
    try {
      await this.updates.activateUpdate();
      this.notify.info('Nueva version disponible. Actualizando app...', 1500);
      this.reloadApp();
    } catch {
      this.notify.error('No se pudo actualizar automaticamente. Recarga la pagina.', 5000);
    }
  }
}
