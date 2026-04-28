import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import {
  FixedCost,
  CostFrequency,
  CostCategory,
  FREQUENCY_DISPLAY,
  COST_CATEGORY_DISPLAY,
  FixedCostInputForm,
} from '../../core/models/fixed-cost';
import { DIALOG_DATA, DIALOG_REF } from '../../core/models/dialog/dialog-tokens.model';
import { DialogRef } from '../../core/models/dialog/dialog-ref.model';

@Component({
  selector: 'app-fixed-cost-form',
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './fixed-cost-form.component.html',
  styleUrl: './fixed-cost-form.component.scss',
})
export class FixedCostFormComponent {
  private dialogRef = inject(DIALOG_REF) as DialogRef<FixedCost | 'delete'>;
  private data = inject(DIALOG_DATA) as FixedCost | null;

  isEdit = !!this.data;

  form: FixedCostInputForm = {
    name: this.data?.name ?? '',
    description: this.data?.description ?? '',
    amount: this.data?.amount ?? 0,
    frequency: this.data?.frequency ?? 'monthly',
    category: this.data?.category ?? 'other',
  };

  frequencies = Object.entries(FREQUENCY_DISPLAY).map(([key, label]) => ({
    key: key as CostFrequency,
    label,
  }));

  categories = Object.entries(COST_CATEGORY_DISPLAY).map(([key, label]) => ({
    key: key as CostCategory,
    label,
  }));

  monthlyEquivalent(): number {
    const { amount, frequency } = this.form;
    if (frequency === 'monthly') return amount;
    if (frequency === 'weekly') return amount * 4;
    return amount;
  }

  isValid(): boolean {
    return !!this.form.name && this.form.amount >= 0;
  }

  save(): void {
    if (this.isValid()) {
      this.dialogRef.close({ ...this.form, active: true });
    }
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }

  remove(): void {
    this.dialogRef.close('delete');
  }
}
