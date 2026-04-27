import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { UiSelectOption } from '../../models/ui-select-option.model';

@Component({
  selector: 'ui-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ui-select.component.html',
  styleUrl: './ui-select.component.scss',
})
export class UiSelectComponent {
  readonly id = input.required<string>();
  readonly label = input.required<string>();
  readonly options = input<UiSelectOption[]>([]);
  readonly value = input('');
  readonly required = input(false);
  readonly disabled = input(false);

  readonly valueChange = output<string>();

  onSelection(event: Event): void {
    const element = event.target as HTMLSelectElement;
    this.valueChange.emit(element.value);
  }
}
