import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { IngredientsStore } from '../../core/store/ingredients.store';
import { ArsPipe } from '../../shared/pipes/ars.pipe';
import { DIALOG_DATA } from '../../core/models/dialog/dialog-tokens.model';
import { UiIconComponent } from '../../shared/ui/components';

interface PriceHistoryDialogData {
  id: string;
  name: string;
}

@Component({
  selector: 'app-price-history',
  imports: [DatePipe, DecimalPipe, ArsPipe, UiIconComponent],
  templateUrl: './price-history.component.html',
  styleUrl: './price-history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriceHistoryComponent {
  private store = inject(IngredientsStore);
  data = inject(DIALOG_DATA) as PriceHistoryDialogData;

  history = toSignal(this.store.getPriceHistory(this.data.id), { initialValue: [] });
}
