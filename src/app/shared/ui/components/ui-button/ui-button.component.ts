import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-button-host',
  },
  templateUrl: './ui-button.component.html',
  styleUrl: './ui-button.component.scss',
})
export class UiButtonComponent {
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly variant = input<'primary' | 'secondary' | 'ghost'>('primary');
  readonly disabled = input(false);
  readonly ariaLabel = input<string | null>(null);
}
