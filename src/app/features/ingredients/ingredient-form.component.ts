import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Ingredient,
  MeasurementUnit,
  IngredientCategory,
  UNIT_DISPLAY,
  INGREDIENT_CATEGORY_DISPLAY,
  IngredientInputForm,
} from '../../core/models/ingredient';
import { DIALOG_DATA, DIALOG_REF } from '../../core/models/dialog/dialog-tokens.model';
import { DialogRef } from '../../core/models/dialog/dialog-ref.model';

@Component({
  selector: 'app-ingredient-form',
  imports: [FormsModule],
  templateUrl: './ingredient-form.component.html',
  styleUrl: './ingredient-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientFormComponent {
  private dialogRef = inject(DIALOG_REF) as DialogRef<Ingredient | 'delete'>;
  private data = inject(DIALOG_DATA) as Ingredient | null;

  isEdit = !!this.data;

  form: IngredientInputForm = {
    name: this.data?.name ?? '',
    unit: this.data?.unit ?? 'kg',
    unitPrice: this.data?.unitPrice ?? 0,
    currentStock: this.data?.currentStock ?? 0,
    minimumStock: this.data?.minimumStock ?? 1,
    category: this.data?.category ?? 'other',
  };

  units = Object.entries(UNIT_DISPLAY).map(([key, label]) => ({
    key: key as MeasurementUnit,
    label,
  }));

  categories = Object.entries(INGREDIENT_CATEGORY_DISPLAY).map(([key, label]) => ({
    key: key as IngredientCategory,
    label,
  }));

  isValid(): boolean {
    return !!(this.form.name && this.form.unit && this.form.unitPrice >= 0);
  }

  save(): void {
    if (this.isValid()) {
      this.dialogRef.close({
        ...this.form,
        lastPurchase: null,
        active: true,
      });
    }
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }

  remove(): void {
    this.dialogRef.close('delete');
  }
}