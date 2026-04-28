import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'ui-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()'
  },
  templateUrl: './ui-modal.component.html',
  styleUrl: './ui-modal.component.scss',
})
export class UiModalComponent {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly closeOnBackdrop = input(true);

  readonly closed = output<undefined>();

  onBackdropClick(): void {
    if (this.closeOnBackdrop()) {
      this.closed.emit(undefined);
    }
  }

  onEscape(): void {
    if (this.open()) {
      this.closed.emit(undefined);
    }
  }
}
