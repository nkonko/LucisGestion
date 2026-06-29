import { ChangeDetectionStrategy, Component, Input, OnDestroy, ViewEncapsulation, computed, signal } from '@angular/core';

@Component({
  selector: 'app-rotating-title',
  standalone: true,
  templateUrl: './rotating-title.component.html',
  styleUrl: './rotating-title.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class RotatingTitleComponent implements OnDestroy {
  @Input() texts: string[] = [];
  @Input() interval = 10000;

  protected readonly currentIndex = signal(0);
  protected readonly currentText = computed(() => this.texts[this.currentIndex()] || '');

  private rotationInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startRotation();
  }

  private startRotation(): void {
    this.rotationInterval = setInterval(() => {
      const nextIndex = (this.currentIndex() + 1) % this.texts.length;
      this.currentIndex.set(nextIndex);
    }, this.interval);
  }

  ngOnDestroy(): void {
    this.stopRotation();
  }

  private stopRotation(): void {
    if (this.rotationInterval === null) {
      return;
    }

    clearInterval(this.rotationInterval);
    this.rotationInterval = null;
  }
}
