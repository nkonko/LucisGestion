import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NotificationService } from '../../core/services/notification.service';
import { RouterLink } from '@angular/router';
import { IngredientesStore } from '../../core/store/ingredientes.store';
import { Ingrediente } from '../../core/models/ingrediente.model';
import { getStockPriority } from '../../core/utils/stock.utils';
import { IngredienteFormComponent } from '../ingredientes/ingrediente-form.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-stock',
  standalone: true,
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
})
export class StockComponent {
  readonly store = inject(IngredientesStore);
  readonly auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);

  // Sort: danger first, then warning, then ok
  sortedIngredientes = this.store.ingredientesOrdenadosPorStock;

  getStockClass(item: Ingrediente): string {
    switch (getStockPriority(item)) {
      case 0:
        return 'stock-danger';
      case 1:
        return 'stock-warning';
      default:
        return 'stock-ok';
    }
  }

  getStockLabel(item: Ingrediente): string {
    switch (getStockPriority(item)) {
      case 0:
        return 'SIN STOCK';
      case 1:
        return 'REPONER';
      default:
        return 'OK';
    }
  }

  getStockPercent(item: Ingrediente): number {
    if (item.stockMinimo <= 0) return 100;
    const percent = (item.stockActual / (item.stockMinimo * 3)) * 100;
    return Math.min(percent, 100);
  }

  getStockBarColor(item: Ingrediente): 'primary' | 'accent' | 'warn' {
    switch (getStockPriority(item)) {
      case 0:
        return 'warn';
      case 1:
        return 'accent';
      default:
        return 'primary';
    }
  }

  crear() {
    const dialogRef = this.dialog.open(IngredienteFormComponent, {
      width: '100%',
      maxWidth: '500px',
      data: null,
    });

    dialogRef.afterClosed().subscribe(async (result: Ingrediente | undefined) => {
      if (result) {
        await this.store.crearIngrediente(result);
        this.notify.success('Ingrediente creado');
      }
    });
  }

  editar(ingrediente: Ingrediente) {
    const dialogRef = this.dialog.open(IngredienteFormComponent, {
      width: '100%',
      maxWidth: '500px',
      data: ingrediente,
    });

    dialogRef.afterClosed().subscribe(async (result: Ingrediente | 'delete' | undefined) => {
      if (result === 'delete') {
        await this.store.eliminarIngrediente(ingrediente.id!);
        this.notify.success('Ingrediente eliminado');
      } else if (result) {
        await this.store.actualizarIngrediente(ingrediente.id!, result);
        this.notify.success('Ingrediente actualizado');
      }
    });
  }
}
