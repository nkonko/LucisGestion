import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Ingredient, RecipeIngredient } from '../../../core/models/ingredient';
import { IngredientsStore } from '../../../core/store/ingredients.store';
import { ArsPipe } from '../../../shared/pipes/ars.pipe';

@Component({
  selector: 'app-ingredient-form',
  imports: [FormsModule, ArsPipe],
  templateUrl: './ingredient-form.component.html',
  styleUrl: './ingredient-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientFormComponent {
  ingredientsStore = inject(IngredientsStore);

  recipeIngredients = input.required<RecipeIngredient[]>();
  recipeIngredientsChange = output<RecipeIngredient[]>();

  ingredientSearch = signal('');

  filteredIngredients = computed(() => {
    const term = this.ingredientSearch().toLowerCase();
    const alreadyAdded = new Set(this.recipeIngredients().map((ri) => ri.ingredientId));
    return this.ingredientsStore.ingredients().filter((i) => {
      const ingredientId = i.id;
      if (!ingredientId) {
        return false;
      }

      return !alreadyAdded.has(ingredientId) && i.name.toLowerCase().includes(term);
    });
  });

  selectedIngredient = computed(() => {
    const name = this.ingredientSearch().trim().toLowerCase();
    if (!name) return null;
    return this.filteredIngredients().find((item) => item.name.toLowerCase() === name) ?? null;
  });

  addIngredient(ingredient: Ingredient): void {
    this.recipeIngredientsChange.emit([
      ...this.recipeIngredients(),
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
    const nextList = this.recipeIngredients().map((item, itemIndex) => {
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

    this.recipeIngredientsChange.emit(nextList);
  }

  removeIngredient(index: number): void {
    this.recipeIngredientsChange.emit(this.recipeIngredients().filter((_, i) => i !== index));
  }
}
