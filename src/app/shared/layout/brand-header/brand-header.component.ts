import { ChangeDetectionStrategy, Component, OnInit, output, signal } from '@angular/core';

const COMPACT_BRAND_SCROLL_THRESHOLD = 24;

@Component({
  selector: 'app-brand-header',
  templateUrl: './brand-header.component.html',
  styleUrl: './brand-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:scroll)': 'onWindowScroll()',
  },
})
export class BrandHeaderComponent implements OnInit {
  readonly compactChanged = output<boolean>();
  readonly isCompact = signal(false);

  ngOnInit(): void {
    this.onWindowScroll();
  }

  onWindowScroll(): void {
    const nextState = globalThis.scrollY > COMPACT_BRAND_SCROLL_THRESHOLD;
    if (nextState === this.isCompact()) {
      return;
    }

    this.isCompact.set(nextState);
    this.compactChanged.emit(nextState);
  }
}
