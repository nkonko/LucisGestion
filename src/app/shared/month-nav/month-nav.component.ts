import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiIconComponent } from '../ui/components';

@Component({
  selector: 'app-month-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiIconComponent],
  templateUrl: './month-nav.component.html',
  styleUrl: './month-nav.component.scss',
})
export class MonthNavComponent {
  readonly label = input.required<string>();
  readonly caption = input<string | null>(null);
  readonly disablePrevious = input(false);
  readonly disableNext = input(false);
  readonly previousLabel = input('Mes anterior');
  readonly nextLabel = input('Mes siguiente');

  readonly previous = output();
  readonly next = output();

  onPrevious(): void {
    if (!this.disablePrevious()) this.previous.emit();
  }

  onNext(): void {
    if (!this.disableNext()) this.next.emit();
  }
}
