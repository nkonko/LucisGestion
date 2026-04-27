import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { IngredientsStore } from '../../core/store/ingredients.store';
import { ArsPipe } from '../../shared/pipes/ars.pipe';

@Component({
  selector: 'app-price-history',
  imports: [MatDialogModule, MatListModule, MatIconModule, MatButtonModule, DatePipe, ArsPipe],
  templateUrl: './price-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriceHistoryComponent {
  private store = inject(IngredientsStore);
  data = inject<{ id: string; name: string }>(MAT_DIALOG_DATA);

  history = toSignal(this.store.getPriceHistory(this.data.id), { initialValue: [] });
}
