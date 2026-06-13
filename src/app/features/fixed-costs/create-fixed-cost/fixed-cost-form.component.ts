import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CostCategory,
  COST_CATEGORY_DISPLAY,
  FixedCostEntryInput,
} from '../../../core/models/fixed-cost';
import { DIALOG_DATA, DIALOG_REF } from '../../../core/models/dialog/dialog-tokens.model';
import { DialogRef } from '../../../core/models/dialog/dialog-ref.model';
import { FixedCostFormData } from '../../../core/models/fixed-cost/fixed-cost-form-data';


@Component({
  selector: 'app-fixed-cost-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './fixed-cost-form.component.html',
  styleUrl: './fixed-cost-form.component.scss',
})
export class FixedCostFormComponent {
  private readonly dialogRef = inject(DIALOG_REF) as DialogRef<FixedCostEntryInput>;
  private readonly data = inject(DIALOG_DATA) as FixedCostFormData;

  readonly isEdit = !!this.data.entry;
  readonly monthLabel = this.data.monthLabel;

  readonly form: FixedCostEntryInput = {
    name: this.data.entry?.name ?? '',
    description: this.data.entry?.description ?? '',
    amount: this.data.entry?.amount ?? 0,
    category: this.data.entry?.category ?? 'other',
  };

  readonly categories = Object.entries(COST_CATEGORY_DISPLAY).map(([key, label]) => ({
    key: key as CostCategory,
    label,
  }));

  isValid(): boolean {
    return !!this.form.name.trim() && Number.isFinite(this.form.amount) && this.form.amount >= 0;
  }

  save(): void {
    if (!this.isValid()) return;
    this.dialogRef.close({
      name: this.form.name.trim(),
      description: this.form.description.trim(),
      amount: Number(this.form.amount),
      category: this.form.category,
    });
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }
}
