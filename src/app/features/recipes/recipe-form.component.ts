import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IngredientsStore } from '../../core/store/ingredients.store';
import { calculateRecipeCost, calculateSuggestedPrice } from '../../core/utils/pricing.utils';
import { Recipe, RecipeCategory, RECIPE_CATEGORY_DISPLAY } from '../../core/models/recipe';
import { Ingredient, RecipeIngredient } from '../../core/models/ingredient';
import { ArsPipe } from '../../shared/pipes/ars.pipe';
import { DIALOG_DATA, DIALOG_REF } from '../../core/models/dialog/dialog-tokens.model';
import { DialogRef } from '../../core/models/dialog/dialog-ref.model';

@Component({
  selector: 'app-recipe-form',
  imports: [FormsModule, ArsPipe],
  templateUrl: './recipe-form.component.html',
  styleUrl: './recipe-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeFormComponent {
  private dialogRef = inject(DIALOG_REF) as DialogRef<Recipe | 'delete'>;
  private data = inject(DIALOG_DATA) as Recipe | null;
  private ingredientsStore = inject(IngredientsStore);

  isEdit = !!this.data;
  ingredientSearch = signal('');
  profitMargin = signal(this.data?.profitMargin ?? 60);

  form = {
    name: this.data?.name ?? '',
    category: (this.data?.category ?? 'cakes') as RecipeCategory,
    yield: this.data?.yield ?? 1,
    salePrice: this.data?.salePrice ?? 0,
    notes: this.data?.notes ?? '',
    imageUrl: this.data?.imageUrl ?? '',
  };

  recipeIngredients = signal<RecipeIngredient[]>(this.data?.ingredients ? [...this.data.ingredients] : []);

  filteredIngredients = computed(() => {
    const term = this.ingredientSearch().toLowerCase();
    const alreadyAdded = new Set(this.recipeIngredients().map((ri) => ri.ingredientId));
    return this.ingredientsStore
      .ingredients()
      .filter((i) => !alreadyAdded.has(i.id!) && i.name.toLowerCase().includes(term));
  });

  selectedIngredient = computed(() => {
    const name = this.ingredientSearch().trim().toLowerCase();
    if (!name) return null;
    return this.filteredIngredients().find((item) => item.name.toLowerCase() === name) ?? null;
  });

  categories = Object.entries(RECIPE_CATEGORY_DISPLAY).map(([key, label]) => ({
    key: key as RecipeCategory,
    label,
  }));

  calculatedCost = computed(() => calculateRecipeCost(this.recipeIngredients(), this.ingredientsStore.ingredients()));

  suggestedPrice = computed(() => calculateSuggestedPrice(this.calculatedCost(), this.profitMargin()));

  onProfitMarginChange(value: number | null): void {
    const nextValue = Number(value ?? 0);
    const normalized = Number.isFinite(nextValue) ? nextValue : 0;
    this.profitMargin.set(normalized);
  }

  addIngredient(ingredient: Ingredient): void {
    this.recipeIngredients.update((list) => [
      ...list,
      {
        ingredientId: ingredient.id ?? '',
        name: ingredient.name,
        quantity: 1,
        unit: ingredient.unit,
        lineCost: ingredient.unitPrice,
      },
    ]);
    this.ingredientSearch.set('');
  }

  addSelectedIngredient(): void {
    const ingredient = this.selectedIngredient();
    if (ingredient) {
      this.addIngredient(ingredient);
    }
  }

  updateQuantity(index: number, quantity: number): void {
    this.recipeIngredients.update((list) => {
      return list.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        const ingredient = this.ingredientsStore
          .ingredients()
          .find((i) => i.id === item.ingredientId);

        return {
          ...item,
          quantity,
          lineCost: Math.round(quantity * (ingredient?.unitPrice ?? 0) * 100) / 100,
        };
      });
    });
  }

  removeIngredient(index: number): void {
    this.recipeIngredients.update((list) => list.filter((_, i) => i !== index));
  }

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
