import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import {
  Ingredient,
  MeasurementUnit,
  IngredientCategory,
  UNIT_DISPLAY,
  INGREDIENT_CATEGORY_DISPLAY,
  IngredientInputForm,
} from '../../core/models/ingredient';

@Component({
  selector: 'app-ingredient-form',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
  ],
  templateUrl: './ingredient-form.component.html',
})
export class IngredientFormComponent {
  private dialogRef = inject(MatDialogRef<IngredientFormComponent>);
  private data: Ingredient | null = inject(MAT_DIALOG_DATA);

  isEdit = !!this.data;

  form: IngredientInputForm = {
    name: this.data?.name ?? '',
    unit: this.data?.unit ?? 'kg',
    unitPrice: this.data?.unitPrice ?? 0,
    currentStock: this.data?.currentStock ?? 0,
    minimumStock: this.data?.minimumStock ?? 1,
    category: this.data?.category ?? 'other',
  };

  units = Object.entries(UNIT_DISPLAY).map(([key, label]) => ({ key, label }));
  categories = Object.entries(INGREDIENT_CATEGORY_DISPLAY).map(([key, label]) => ({
    key,
    label,
  }));

  isValid(): boolean {
    return !!(this.form.name && this.form.unit && this.form.unitPrice >= 0);
  }

  save() {
    if (this.isValid()) {
      this.dialogRef.close({
        ...this.form,
        lastPurchase: null,
        active: true,
      });
    }
  }

  remove() {
    this.dialogRef.close('delete');
  }
}
