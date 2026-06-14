import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IngredientsStore } from '../../../core/store/ingredients.store';
import { calculateRecipeCost, calculateSuggestedPrice } from '../../../core/utils/pricing.utils';
import { Recipe, RecipeCategory } from '../../../core/models/recipe';
import { RecipeIngredient } from '../../../core/models/ingredient';
import { DIALOG_DATA, DIALOG_REF } from '../../../core/models/dialog/dialog-tokens.model';
import { DialogRef } from '../../../core/models/dialog/dialog-ref.model';
import { CategoryFormComponent } from './category-form/category-form.component';
import { RecipeIngredientFormComponent } from './ingredient-form/ingredient-form.component';
import { CostFormComponent } from './cost-form/cost-form.component';
import { UiIconComponent } from '../../../shared/ui/components';

@Component({
  selector: 'app-recipe-form',
  imports: [
    FormsModule,
    CategoryFormComponent,
    RecipeIngredientFormComponent,
    CostFormComponent,
    UiIconComponent,
  ],
  templateUrl: './recipe-form.component.html',
  styleUrl: './recipe-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeFormComponent {
  private dialogRef = inject(DIALOG_REF) as DialogRef<Recipe | 'delete'>;
  private data = inject(DIALOG_DATA) as Recipe | null;
  private ingredientsStore = inject(IngredientsStore);

  isEdit = !!this.data;
  profitMargin = signal(this.data?.profitMargin ?? 60);

  form = {
    name: this.data?.name ?? '',
    category: (this.data?.category ?? 'cakes') as RecipeCategory,
    yield: this.data?.yield ?? 1,
    salePrice: this.data?.salePrice ?? 0,
    notes: this.data?.notes ?? '',
    imageUrl: this.data?.imageUrl ?? '',
  };

  recipeIngredients = signal<RecipeIngredient[]>(
    this.data?.ingredients ? [...this.data.ingredients] : [],
  );

  calculatedCost = computed(() =>
    calculateRecipeCost(this.recipeIngredients(), this.ingredientsStore.ingredients()),
  );

  suggestedPrice = computed(() =>
    calculateSuggestedPrice(this.calculatedCost(), this.profitMargin()),
  );

  isValid(): boolean {
    return !!(this.form.name && this.recipeIngredients().length > 0);
  }

  save(): void {
    if (!this.isValid()) return;

    const cost = this.calculatedCost();
    const suggested = this.suggestedPrice();

    this.dialogRef.close({
      ...this.form,
      profitMargin: this.profitMargin(),
      ingredients: this.recipeIngredients(),
      calculatedCost: cost,
      suggestedPrice: suggested,
      salePrice: this.form.salePrice || suggested,
      active: true,
    } as Recipe);
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }

  remove(): void {
    this.dialogRef.close('delete');
  }
}
