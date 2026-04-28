import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

@Component({
  selector: 'ui-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ui-icon.component.html',
  styleUrl: './ui-icon.component.scss',
})
export class UiIconComponent {
  private document = inject(DOCUMENT);

  readonly name = input.required<string>();
  readonly size = input(24);
  readonly decorative = input(false);
  readonly label = input<string | null>(null);
  readonly spriteHrefPrefix = `${new URL('icons.svg', this.document.baseURI).toString()}#`;
}
