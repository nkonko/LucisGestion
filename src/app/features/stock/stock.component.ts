import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NotificationService } from '../../core/services/notification.service';
import { RouterLink } from '@angular/router';
import { IngredientsStore } from '../../core/store/ingredients.store';
import { Ingredient } from '../../core/models/ingredient';
import { getStockPriority } from '../../core/utils/stock.utils';
import { IngredientFormComponent } from '../ingredients/ingredient-form.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-stock',
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatListModule,
    MatDialogModule,
    RouterLink,
  ],
  templateUrl: './stock.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockComponent {
  readonly store = inject(IngredientsStore);
  readonly auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);

  sortedIngredients = this.store.ingredientsSortedByStock;

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
        return 'SIN STOCK';
      case 1:
        return 'REPONER';
      default:
        return 'OK';
    }
  }

  getStockPercent(item: Ingredient): number {
    if (item.minimumStock <= 0) return 100;
    const percent = (item.currentStock / (item.minimumStock * 3)) * 100;
    return Math.min(percent, 100);
  }

  getStockBarColor(item: Ingredient): 'primary' | 'accent' | 'warn' {
    switch (getStockPriority(item)) {
      case 0:
        return 'warn';
      case 1:
        return 'accent';
      default:
        return 'primary';
    }
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
        await this.store.updateIngredient(ingredient.id!, result);
        this.notify.success('Ingrediente actualizado');
      }
    });
  }
}
