import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { UiToastService } from '../../services/ui-toast.service';

@Component({
  selector: 'ui-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ui-toast.component.html',
  styleUrl: './ui-toast.component.scss',
})
export class UiToastComponent {
  readonly toastService = inject(UiToastService);
}
