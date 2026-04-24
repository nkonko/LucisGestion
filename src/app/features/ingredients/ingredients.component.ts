import { Component, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NotificationService } from '../../core/services/notification.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { IngredientsStore } from '../../core/store/ingredients.store';
import { RecipesStore } from '../../core/store/recipes.store';
import { Ingredient } from '../../core/models/ingredient';
import { ArsPipe } from '../../shared/pipes/ars.pipe';
import { IngredientFormComponent } from './ingredient-form.component';
import { PriceHistoryComponent } from './price-history.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-ingredients',
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    ArsPipe,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './ingredients.component.html',
})
export class IngredientsComponent {
  readonly store = inject(IngredientsStore);
  private recipesStore = inject(RecipesStore);
  readonly auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);

  searchTerm = signal('');

  filteredIngredients = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const items = this.store.ingredients();
    if (!term) return items;
    return items.filter((i) => i.name.toLowerCase().includes(term));
  });

  getStockClass(i: Ingredient): string {
    if (i.currentStock <= 0) return 'stock-danger';
    if (i.currentStock <= i.minimumStock) return 'stock-warning';
    return 'stock-ok';
  }

  create() {
    const dialogRef = this.dialog.open(IngredientFormComponent, {
      width: '100%',
      maxWidth: '500px',
      data: null,
    });

    dialogRef.afterClosed().subscribe(async (result: Ingredient | undefined) => {
      if (result) {
        await this.store.createIngredient(result);
        this.notify.success('Ingrediente creado');
      }
    });
  }

  edit(ingredient: Ingredient) {
    const dialogRef = this.dialog.open(IngredientFormComponent, {
      width: '100%',
      maxWidth: '500px',
      data: ingredient,
    });

    dialogRef.afterClosed().subscribe(async (result: Ingredient | 'delete' | undefined) => {
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

  viewHistory(ingredient: Ingredient, event: Event) {
    event.stopPropagation();
    this.dialog.open(PriceHistoryComponent, {
      width: '100%',
      maxWidth: '450px',
      data: { id: ingredient.id, name: ingredient.name },
    });
  }
}
