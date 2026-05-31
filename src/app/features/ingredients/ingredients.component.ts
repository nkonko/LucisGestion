import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';
import { IngredientsStore } from '../../core/store/ingredients.store';
import { DEFAULT_INGREDIENT_ICON, Ingredient } from '../../core/models/ingredient';
import { ArsPipe } from '../../shared/pipes/ars.pipe';
import { IngredientFormComponent } from './ingredient-form.component';
import { PriceHistoryComponent } from './price-history.component';
import { DialogService } from '../../core/services/dialog.service';
import { UiIconComponent } from '../../shared/ui/components';
import { AuthStore } from '../../core/store/auth.store';

@Component({
  selector: 'app-ingredients',
  imports: [ArsPipe, UiIconComponent],
  templateUrl: './ingredients.component.html',
  styleUrl: './ingredients.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientsComponent {
  readonly store = inject(IngredientsStore);
  readonly auth = inject(AuthStore);
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
    const htmlTarget = event.target as HTMLInputElement | null;
    this.searchTerm.set(htmlTarget?.value ?? '');
  }


  getIngredientIcon(ingredient: Ingredient): string {
    return ingredient.icon || DEFAULT_INGREDIENT_ICON;
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
        await this.store.updateIngredient(ingredient.id!, result);
        this.notify.success('Ingrediente actualizado');
      }
    });
  }

  viewHistory(ingredient: Ingredient, event: Event): void {
    event.stopPropagation();
    this.dialog.open<{ id: string; name: string }, never>(PriceHistoryComponent, {
      maxWidth: '450px',
      data: { id: ingredient.id ?? '', name: ingredient.name },
    });
  }
}
