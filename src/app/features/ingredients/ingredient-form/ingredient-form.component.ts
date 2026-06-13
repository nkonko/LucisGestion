import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DEFAULT_INGREDIENT_ICON,
  INGREDIENT_ICON_OPTIONS,
  Ingredient,
  MeasurementUnit,
  IngredientCategory,
  UNIT_DISPLAY,
  INGREDIENT_CATEGORY_DISPLAY,
  IngredientInputForm,
} from '../../../core/models/ingredient';
import { DIALOG_DATA, DIALOG_REF } from '../../../core/models/dialog/dialog-tokens.model';
import { DialogRef } from '../../../core/models/dialog/dialog-ref.model';
import { UiIconComponent } from '../../../shared/ui/components';

@Component({
  selector: 'app-ingredient-form',
  imports: [FormsModule, UiIconComponent],
  templateUrl: './ingredient-form.component.html',
  styleUrl: './ingredient-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientFormComponent {
  private dialogRef = inject(DIALOG_REF) as DialogRef<Ingredient | 'delete'>;
  private data = inject(DIALOG_DATA) as Ingredient | null;

  isEdit = !!this.data;
  icons = INGREDIENT_ICON_OPTIONS;

  form: IngredientInputForm = {
    name: this.data?.name ?? '',
    unit: this.data?.unit ?? 'kg',
    unitPrice: this.data?.unitPrice ?? 0,
    currentStock: this.data?.currentStock ?? 0,
    minimumStock: this.data?.minimumStock ?? 1,
    category: this.data?.category ?? 'other',
    icon: this.data?.icon ?? DEFAULT_INGREDIENT_ICON,
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

  selectIcon(icon: string): void {
    this.form.icon = icon;
  }

  save(): void {
    if (this.isValid()) {
      this.dialogRef.close({
        ...this.form,
        icon: this.form.icon || DEFAULT_INGREDIENT_ICON,
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
