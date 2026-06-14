import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DemoModeService {
  readonly isDemoMode = signal(false);

  enterDemoMode(): void {
    this.isDemoMode.set(true);
  }

  exitDemoMode(): void {
    this.isDemoMode.set(false);
  }
}
