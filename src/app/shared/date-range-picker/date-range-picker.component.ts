import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-date-range-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './date-range-picker.component.html',
  styleUrl: './date-range-picker.component.scss',
})
export class DateRangePickerComponent {
  readonly dateFrom = input<string | null>(null);
  readonly dateTo = input<string | null>(null);

  readonly dateFromChange = output<string>();
  readonly dateToChange = output<string>();

  readonly validationError = signal<string | null>(null);

  private errorTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly formattedDateFrom = computed(() => this.formatDisplay(this.dateFrom()));
  readonly formattedDateTo = computed(() => this.formatDisplay(this.dateTo()));

  private formatDisplay(value: string | null): string {
    if (!value) return '';
    const parts = value.split('-');
    if (parts.length !== 3) return '';
    const [, m, d] = parts;
    const y = parts[0];
    return `${d}/${m}/${y}`;
  }

  onDateFromInput(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    const newValue = event.target.value;
    if (!newValue) return;

    const currentTo = this.dateTo();
    if (currentTo && newValue > currentTo) {
      this.showError('La fecha desde no puede ser posterior a la fecha hasta');
      this.dateFromChange.emit(newValue);
      this.dateToChange.emit(newValue);
      return;
    }

    this.clearError();
    this.dateFromChange.emit(newValue);
  }

  onDateToInput(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    const newValue = event.target.value;
    if (!newValue) return;

    const currentFrom = this.dateFrom();
    if (currentFrom && newValue < currentFrom) {
      this.showError('La fecha hasta no puede ser anterior a la fecha desde');
      this.dateToChange.emit(newValue);
      this.dateFromChange.emit(newValue);
      return;
    }

    this.clearError();
    this.dateToChange.emit(newValue);
  }

  private showError(message: string): void {
    this.validationError.set(message);
    if (this.errorTimeout) clearTimeout(this.errorTimeout);
    this.errorTimeout = setTimeout(() => this.validationError.set(null), 3000);
  }

  private clearError(): void {
    this.validationError.set(null);
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
      this.errorTimeout = null;
    }
  }
}
