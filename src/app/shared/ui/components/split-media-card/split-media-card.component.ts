import { NgOptimizedImage } from '@angular/common';
import { Component, computed, input } from '@angular/core';

export type SplitMediaCardImagePosition = 'left' | 'right';

@Component({
  selector: 'app-split-media-card',
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: './split-media-card.component.html',
  styleUrl: './split-media-card.component.scss',
  host: {
    class: 'split-media-card',
    '[class.split-media-card--reverse]': 'isReversed()',
  },
})
export class SplitMediaCardComponent {
  readonly eyebrow = input<string | null>(null);
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly imageSrc = input.required<string>();
  readonly imageAlt = input.required<string>();
  readonly imagePosition = input<SplitMediaCardImagePosition>('left');

  readonly isReversed = computed(() => this.imagePosition() === 'right');
}