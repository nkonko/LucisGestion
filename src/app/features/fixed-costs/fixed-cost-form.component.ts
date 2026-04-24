import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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

@Component({
  selector: 'app-fixed-cost-form',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    CurrencyPipe,
  ],
  templateUrl: './fixed-cost-form.component.html',
})
export class FixedCostFormComponent {
  private dialogRef = inject(MatDialogRef<FixedCostFormComponent>);
  private data: FixedCost | null = inject(MAT_DIALOG_DATA);

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
    return !!(
      this.form.name &&
      this.form.amount >= 0 &&
      this.form.frequency &&
      this.form.category
    );
  }

  save() {
    if (this.isValid()) {
      this.dialogRef.close({ ...this.form, active: true });
    }
  }

  remove() {
    this.dialogRef.close('delete');
  }
}
