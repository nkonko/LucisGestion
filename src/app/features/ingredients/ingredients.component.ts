import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';
import { IngredientsStore } from '../../core/store/ingredients.store';
import { RecipesStore } from '../../core/store/recipes.store';
import { Ingredient } from '../../core/models/ingredient';
import { ArsPipe } from '../../shared/pipes/ars.pipe';
import { IngredientFormComponent } from './ingredient-form.component';
import { PriceHistoryComponent } from './price-history.component';
import { AuthService } from '../../core/services/auth.service';
import { DialogService } from '../../core/services/dialog.service';

@Component({
  selector: 'app-ingredients',
  imports: [ArsPipe],
  templateUrl: './ingredients.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientsComponent {
  readonly store = inject(IngredientsStore);
  private recipesStore = inject(RecipesStore);
  readonly auth = inject(AuthService);
  private dialog = inject(DialogService);
  private notify = inject(NotificationService);

  searchTerm = signal('');

  filteredIngredients = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const items = this.store.ingredients();
    if (!term) return items;
    return items.filter((i) => i.name.toLowerCase().includes(term));
  });

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchTerm.set(target?.value ?? '');
  }

  getStockClass(i: Ingredient): string {
    if (i.currentStock <= 0) return 'stock-danger';
    if (i.currentStock <= i.minimumStock) return 'stock-warning';
    return 'stock-ok';
  }

  create(): void {
    const dialogRef = this.dialog.open<null, Ingredient>(IngredientFormComponent, {
      maxWidth: '500px',
      data: null,
    });

    dialogRef.afterClosed.subscribe(async (result) => {
      if (result) {
        await this.store.createIngredient(result);
        this.notify.success('Ingrediente creado');
      }
    });
  }

  edit(ingredient: Ingredient): void {
    const dialogRef = this.dialog.open<Ingredient, Ingredient | 'delete'>(IngredientFormComponent, {
      maxWidth: '500px',
      data: ingredient,
    });

    dialogRef.afterClosed.subscribe(async (result) => {
      if (result === 'delete') {
        await this.store.deleteIngredient(ingredient.id!);
        this.notify.success('Ingrediente eliminado');
      } else if (result) {
        const priceChanged = result.unitPrice !== ingredient.unitPrice;
        await this.store.updateIngredient(ingredient.id!, result);
        if (priceChanged) {
          await this.recipesStore.recalculateForIngredientChange(ingredient.id!);
          this.notify.success('Ingrediente actualizado. Recetas recalculadas.', 3000);
        } else {
          this.notify.success('Ingrediente actualizado');
        }
      }
    });
  }

  viewHistory(ingredient: Ingredient, event: Event): void {
    event.stopPropagation();
    this.dialog.open<{ id: string; name: string }, never>(PriceHistoryComponent, {
      maxWidth: '450px',
      data: { id: ingredient.id!, name: ingredient.name },
    });
  }
}
