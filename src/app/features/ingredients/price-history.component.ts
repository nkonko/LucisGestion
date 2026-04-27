import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { IngredientsStore } from '../../core/store/ingredients.store';
import { ArsPipe } from '../../shared/pipes/ars.pipe';
import { DIALOG_DATA, DIALOG_REF } from '../../core/models/dialog/dialog-tokens.model';
import { DialogRef } from '../../core/models/dialog/dialog-ref.model';

interface PriceHistoryDialogData {
  id: string;
  name: string;
}

@Component({
  selector: 'app-price-history',
  imports: [DatePipe, ArsPipe],
  templateUrl: './price-history.component.html',
  styleUrl: './price-history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriceHistoryComponent {
  private store = inject(IngredientsStore);
  private dialogRef = inject(DIALOG_REF) as DialogRef<undefined>;
  data = inject(DIALOG_DATA) as PriceHistoryDialogData;

  history = toSignal(this.store.getPriceHistory(this.data.id), { initialValue: [] });

  close(): void {
    this.dialogRef.close(undefined);
  }
}
