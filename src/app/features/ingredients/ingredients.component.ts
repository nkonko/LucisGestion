import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { IngredientsStore } from '../../core/store/ingredients.store';
import { DEFAULT_INGREDIENT_ICON, Ingredient } from '../../core/models/ingredient';
import { ArsPipe } from '../../shared/pipes/ars.pipe';
import { PriceHistoryComponent } from './price-history.component';
import { BottomSheetService } from '../../core/services/bottom-sheet.service';
import { UiIconComponent } from '../../shared/ui/components';

@Component({
  selector: 'app-ingredients',
  imports: [ArsPipe, UiIconComponent],
  templateUrl: './ingredients.component.html',
  styleUrl: './ingredients.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientsComponent {
  readonly store = inject(IngredientsStore);
  private dialog = inject(BottomSheetService);

  searchTerm = signal('');

  filteredIngredients = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const items = this.store.ingredients();
    if (!term) return items;
    return items.filter((i) => i.name.toLowerCase().includes(term));
  });

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim();
    this.searchTerm.set(value);
  }


  getIngredientIcon(ingredient: Ingredient): string {
    return ingredient.icon || DEFAULT_INGREDIENT_ICON;
  }

  openHistory(ingredient: Ingredient): void {
    this.dialog.open<{ id: string; name: string }, never>(PriceHistoryComponent, {
      title: 'Historial de precios',
      section: ingredient.name,
      maxWidth: '480px',
      maxHeight: '90vh',
      data: { id: ingredient.id ?? '', name: ingredient.name },
    });
  }
}
