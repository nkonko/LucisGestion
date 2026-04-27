import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ui-icon.component.html',
  styleUrl: './ui-icon.component.scss',
})
export class UiIconComponent {
  readonly name = input.required<string>();
  readonly size = input(24);
  readonly decorative = input(false);
  readonly label = input<string | null>(null);
}
