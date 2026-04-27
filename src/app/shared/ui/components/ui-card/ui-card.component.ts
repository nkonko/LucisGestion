import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ui-card.component.html',
  styleUrl: './ui-card.component.scss',
})
export class UiCardComponent {
  readonly title = input<string | null>(null);
}
