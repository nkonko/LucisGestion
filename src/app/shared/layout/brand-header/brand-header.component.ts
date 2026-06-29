import { ChangeDetectionStrategy, Component, OnInit, output, signal } from '@angular/core';
import { isBrandCompactByScroll } from './brand-compact.util';

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
    const nextState = isBrandCompactByScroll(globalThis.scrollY);
    if (nextState === this.isCompact()) {
      return;
    }

    this.isCompact.set(nextState);
    this.compactChanged.emit(nextState);
  }
}
