import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'ui-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ui-input.component.html',
  styleUrl: './ui-input.component.scss',
})
export class UiInputComponent {
  readonly id = input.required<string>();
  readonly label = input.required<string>();
  readonly type = input<'text' | 'email' | 'number' | 'password' | 'tel'>('text');
  readonly placeholder = input('');
  readonly value = input('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly describedBy = input<string | null>(null);

  readonly valueChange = output<string>();
  readonly blurred = output<void>();

  onInput(event: Event): void {
    const element = event.target as HTMLInputElement;
    this.valueChange.emit(element.value);
  }

  onBlur(): void {
    this.blurred.emit();
  }
}
