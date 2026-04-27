import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormsModule } from '@angular/forms';
import { IngredientsStore } from '../../core/store/ingredients.store';
import { calculateRecipeCost, calculateSuggestedPrice } from '../../core/utils/pricing.utils';
import { Recipe, RecipeCategory, RECIPE_CATEGORY_DISPLAY } from '../../core/models/recipe';
import { RecipeIngredient } from '../../core/models/ingredient';
import { ArsPipe } from '../../shared/pipes/ars.pipe';

@Component({
  selector: 'app-recipe-form',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatAutocompleteModule,
    FormsModule,
    ArsPipe,
  ],
  templateUrl: './recipe-form.component.html',
  styleUrl: './recipe-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeFormComponent {
  private dialogRef = inject(MatDialogRef<RecipeFormComponent>);
  private data: Recipe | null = inject(MAT_DIALOG_DATA);
  private ingredientsStore = inject(IngredientsStore);

  isEdit = !!this.data;
  ingredientSearch = signal('');

  form = {
    name: this.data?.name ?? '',
    category: (this.data?.category ?? 'cakes') as RecipeCategory,
    yield: this.data?.yield ?? 1,
    profitMargin: this.data?.profitMargin ?? 60,
    salePrice: this.data?.salePrice ?? 0,
    notes: this.data?.notes ?? '',
    imageUrl: this.data?.imageUrl ?? '',
  };

  recipeIngredients = signal<RecipeIngredient[]>(
    this.data?.ingredients ? [...this.data.ingredients] : [],
  );

  filteredIngredients = computed(() => {
    const term = this.ingredientSearch().toLowerCase();
    const alreadyAdded = new Set(this.recipeIngredients().map((ri) => ri.ingredientId));
    return this.ingredientsStore
      .ingredients()
      .filter((i) => !alreadyAdded.has(i.id!) && i.name.toLowerCase().includes(term));
  });

  categories = Object.entries(RECIPE_CATEGORY_DISPLAY).map(([key, label]) => ({ key, label }));

  calculatedCost = computed(() =>
    calculateRecipeCost(this.recipeIngredients(), this.ingredientsStore.ingredients()),
  );

  suggestedPrice = computed(() =>
    calculateSuggestedPrice(this.calculatedCost(), this.form.profitMargin),
  );

  addIngredient(ing: any) {
    this.recipeIngredients.update((list) => [
      ...list,
      {
        ingredientId: ing.id!,
        name: ing.name,
        quantity: 1,
        unit: ing.unit,
        lineCost: ing.unitPrice,
      },
    ]);
    this.ingredientSearch.set('');
  }

  updateQuantity(index: number, quantity: number) {
    this.recipeIngredients.update((list) => {
      const updated = [...list];
      const ing = this.ingredientsStore
        .ingredients()
        .find((i) => i.id === updated[index].ingredientId);
      updated[index] = {
        ...updated[index],
        quantity,
        lineCost: Math.round(quantity * (ing?.unitPrice ?? 0) * 100) / 100,
      };
      return updated;
    });
  }

  removeIngredient(index: number) {
    this.recipeIngredients.update((list) => list.filter((_, i) => i !== index));
  }

  recalculate() {
    // Triggers computed signals automatically
  }

  isValid(): boolean {
    return !!(this.form.name && this.recipeIngredients().length > 0);
  }

  save() {
    if (!this.isValid()) return;

    const cost = this.calculatedCost();
    const suggested = this.suggestedPrice();

    this.dialogRef.close({
      ...this.form,
      ingredients: this.recipeIngredients(),
      calculatedCost: cost,
      suggestedPrice: suggested,
      salePrice: this.form.salePrice || suggested,
      active: true,
    } as Recipe);
  }

  remove() {
    this.dialogRef.close('delete');
  }
}
