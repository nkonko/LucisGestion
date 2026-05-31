import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { IngredientsStore } from '../../core/store/ingredients.store';
import { DEFAULT_INGREDIENT_ICON, Ingredient } from '../../core/models/ingredient';
import { getStockPriority } from '../../core/utils/stock.utils';
import { IngredientFormComponent } from '../ingredients/ingredient-form.component';
import { UiIconComponent } from '../../shared/ui/components';
import { AuthStore } from '../../core/store/auth.store';
import { BottomSheetService } from '../../core/services/bottom-sheet.service';

type StockFilter = 'all' | 'low' | 'empty';

@Component({
  selector: 'app-stock',
  imports: [DecimalPipe, RouterLink, UiIconComponent],
  templateUrl: './stock.component.html',
  styleUrl: './stock.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockComponent {
  readonly store = inject(IngredientsStore);
  readonly auth = inject(AuthStore);
  private bottomSheet = inject(BottomSheetService);
  private notify = inject(NotificationService);

  searchTerm = signal('');
  selectedFilter = signal<StockFilter>('all');

  sortedIngredients = this.store.ingredientsSortedByStock;
  lowStockCount = computed(() => this.sortedIngredients().filter((item) => getStockPriority(item) === 1).length);
  emptyStockCount = computed(() => this.sortedIngredients().filter((item) => getStockPriority(item) === 0).length);

  filteredIngredients = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const filter = this.selectedFilter();

    return this.sortedIngredients().filter((item) => {
      const matchesTerm = !term || item.name.toLowerCase().includes(term) || item.category.toLowerCase().includes(term);
      if (!matchesTerm) return false;
      if (filter === 'low') return getStockPriority(item) === 1;
      if (filter === 'empty') return getStockPriority(item) === 0;
      return true;
    });
  });

  onSearchInput(event: Event): void {
    const htmlTarget = event.target as HTMLInputElement | null;
    this.searchTerm.set(htmlTarget?.value ?? '');
  }

  selectFilter(filter: StockFilter): void {
    this.selectedFilter.set(filter);
  }

  getIngredientIcon(item: Ingredient): string {
    return item.icon || DEFAULT_INGREDIENT_ICON;
  }

  getStockClass(item: Ingredient): string {
    switch (getStockPriority(item)) {
      case 0:
        return 'stock-danger';
      case 1:
        return 'stock-warning';
      default:
        return 'stock-ok';
    }
  }

  getStockLabel(item: Ingredient): string {
    switch (getStockPriority(item)) {
      case 0:
        return 'Sin stock';
      case 1:
        return 'Reponer';
      default:
        return 'OK';
    }
  }

  getStockPercent(item: Ingredient): number {
    if (item.minimumStock <= 0) return 100;
    const percent = (item.currentStock / (item.minimumStock * 3)) * 100;
    return Math.min(Math.max(percent, 0), 100);
  }

  create(): void {
    const dialogRef = this.bottomSheet.open<null, Ingredient>(IngredientFormComponent, {
      maxWidth: '760px',
      maxHeight: '90vh',
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
    const dialogRef = this.bottomSheet.open<Ingredient, Ingredient | 'delete'>(IngredientFormComponent, {
      maxWidth: '760px',
      maxHeight: '90vh',
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
}
