import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'lucis-dark-mode';
  private _dark = signal(this.loadPreference());

  readonly dark = this._dark.asReadonly();

  constructor() {
    this.applyClass(this._dark());
  }

  toggle(): void {
    const next = !this._dark();
    this._dark.set(next);
    this.applyClass(next);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(next));
  }

  private loadPreference(): boolean {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored !== null) {
      return JSON.parse(stored) as boolean;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private applyClass(dark: boolean): void {
    document.documentElement.classList.toggle('dark', dark);
  }
}
