import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DEFAULT_INGREDIENT_ICON, Ingredient, RecipeIngredient } from '../../../../core/models/ingredient';
import { IngredientsStore } from '../../../../core/store/ingredients.store';
import { ArsPipe } from '../../../../shared/pipes/ars.pipe';

@Component({
  selector: 'app-recipe-ingredient-form',
  imports: [FormsModule, ArsPipe],
  templateUrl: './ingredient-form.component.html',
  styleUrl: './ingredient-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeIngredientFormComponent {
  protected readonly DEFAULT_INGREDIENT_ICON = DEFAULT_INGREDIENT_ICON;

  ingredientsStore = inject(IngredientsStore);

  recipeIngredients = input.required<RecipeIngredient[]>();
  recipeIngredientsChange = output<RecipeIngredient[]>();

  ingredientSearch = signal('');
  isDropdownOpen = signal(false);

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
    this.isDropdownOpen.set(false);
  }

  onSearchChange(value: string): void {
    this.ingredientSearch.set(value);
    this.isDropdownOpen.set(true);
  }

  openDropdown(): void {
    this.isDropdownOpen.set(true);
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target || !target.closest('.ingredient-search-wrapper')) {
      this.isDropdownOpen.set(false);
    }
  }
}
