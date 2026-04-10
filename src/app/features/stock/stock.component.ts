import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { PasteleriaStore } from '../../core/store';
import { Ingrediente } from '../../core/models';
import { IngredienteFormComponent } from '../ingredientes/ingrediente-form.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatProgressBarModule,
    MatListModule, MatDialogModule, MatSnackBarModule, RouterLink,
  ],
  template: `
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold">Stock de Ingredientes</h2>
      <a mat-stroked-button routerLink="/ingredientes">
        <mat-icon>list</mat-icon> Ver todos
      </a>
    </div>

    @if (store.stockBajo().length > 0) {
      <div class="mb-4 p-3 bg-red-50 rounded-lg">
        <div class="text-sm font-medium text-red-700 mb-1">
          <mat-icon class="align-middle" style="font-size: 18px">warning</mat-icon>
          {{ store.stockBajo().length }} ingrediente(s) con stock bajo
        </div>
      </div>
    }

    @for (item of sortedIngredientes(); track item.id) {
      <mat-card class="touch-card mb-3" (click)="auth.isOwner() ? editar(item) : null">
        <mat-card-content class="py-2">
          <div class="flex items-center justify-between mb-1">
            <div>
              <div class="font-medium">{{ item.nombre }}</div>
              <div class="text-xs text-gray-500">{{ item.categoria }}</div>
            </div>
            <div class="text-right">
              <div [class]="getStockClass(item)" class="text-lg font-bold">
                {{ item.stockActual }}
              </div>
              <div class="text-xs text-gray-400">{{ item.unidad }}</div>
            </div>
          </div>

          <mat-progress-bar
            [mode]="'determinate'"
            [value]="getStockPercent(item)"
            [color]="getStockBarColor(item)">
          </mat-progress-bar>

          <div class="flex justify-between text-xs text-gray-400 mt-1">
            <span>Mínimo: {{ item.stockMinimo }} {{ item.unidad }}</span>
            <span [class]="getStockClass(item)">
              @if (item.stockActual <= 0) {
                SIN STOCK
              } @else if (item.stockActual <= item.stockMinimo) {
                REPONER
              } @else {
                OK
              }
            </span>
          </div>
        </mat-card-content>
      </mat-card>
    }

    @if (sortedIngredientes().length === 0) {
      <div class="text-center py-8 text-gray-400">
        <mat-icon style="font-size: 48px; width: 48px; height: 48px">inventory_2</mat-icon>
        <p>No hay ingredientes cargados aún</p>
        <p class="text-sm">Tocá el botón + para agregar el primero</p>
      </div>
    }

    @if (auth.isOwner()) {
      <button mat-fab class="fab-bottom-right" color="primary" (click)="crear()">
        <mat-icon>add</mat-icon>
      </button>
    }
  `,
})
export class StockComponent {
  readonly store = inject(PasteleriaStore);
  readonly auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // Sort: danger first, then warning, then ok
  sortedIngredientes = this.store.ingredientesOrdenadosPorStock;

  getStockClass(item: Ingrediente): string {
    if (item.stockActual <= 0) return 'stock-danger';
    if (item.stockActual <= item.stockMinimo) return 'stock-warning';
    return 'stock-ok';
  }

  getStockPercent(item: Ingrediente): number {
    if (item.stockMinimo <= 0) return 100;
    const percent = (item.stockActual / (item.stockMinimo * 3)) * 100;
    return Math.min(percent, 100);
  }

  getStockBarColor(item: Ingrediente): 'primary' | 'accent' | 'warn' {
    if (item.stockActual <= 0) return 'warn';
    if (item.stockActual <= item.stockMinimo) return 'accent';
    return 'primary';
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
        this.snackBar.open('Ingrediente creado', 'OK', { duration: 2000 });
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
        this.snackBar.open('Ingrediente eliminado', 'OK', { duration: 2000 });
      } else if (result) {
        await this.store.actualizarIngrediente(ingrediente.id!, result);
        this.snackBar.open('Ingrediente actualizado', 'OK', { duration: 2000 });
      }
    });
  }
}
