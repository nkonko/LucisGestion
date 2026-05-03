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

  previousMonth = output();
  nextMonth = output();
  currentMonth = output();
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
    const monthText = (event.target as HTMLInputElement).value.trim();
    if (!/^\d{4}-\d{2}$/.test(monthText)) {
      return;
    }
    const selectedDate = fromMonthInputValue(monthText);
    if (selectedDate) {
      this.monthChange.emit(selectedDate);
    }
  }
}
