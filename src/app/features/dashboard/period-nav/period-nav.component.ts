import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { fromMonthInputValue } from '../../../core/utils/dashboard.utils';
import { SelectedDate } from '../../../core/models/dashboard';
import { UiIconComponent } from '../../../shared/ui/components';

@Component({
  selector: 'app-period-nav',
  imports: [UiIconComponent],
  templateUrl: './period-nav.component.html',
  styleUrl: './period-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeriodNavComponent {
  periodLabel = input.required<string>();
  monthInputValue = input.required<string>();
  currentMonthMax = input.required<string>();
  isCurrentMonth = input(false);

  previousMonth = output<void>();
  nextMonth = output<void>();
  currentMonth = output<void>();
  monthChange = output<SelectedDate>();

  onPreviousMonth(): void {
    this.previousMonth.emit();
  }

  onNextMonth(): void {
    this.nextMonth.emit();
  }

  onCurrentMonth(): void {
    this.currentMonth.emit();
  }

  onMonthChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (value) {
      this.monthChange.emit(fromMonthInputValue(value));
    }
  }
}
