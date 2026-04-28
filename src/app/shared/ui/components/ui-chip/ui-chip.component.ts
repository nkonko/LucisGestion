import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'ui-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ui-chip.component.html',
  styleUrl: './ui-chip.component.scss',
})
export class UiChipComponent {
  readonly selected = input(false);
  readonly disabled = input(false);
  readonly pressedChange = output<boolean>();

  onToggle(): void {
    this.pressedChange.emit(!this.selected());
  }
}
