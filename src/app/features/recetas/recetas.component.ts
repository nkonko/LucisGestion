import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PasteleriaStore } from '../../core/store';
import { Receta } from '../../core/models';
import { ArsPipe } from '../../shared/pipes/ars.pipe';
import { RecetaFormComponent } from './receta-form.component';
import { CatalogoDialogComponent } from './catalogo-dialog.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-recetas',
  standalone: true,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatMenuModule, MatDialogModule, MatSnackBarModule, ArsPipe,
  ],
  template: `
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold">Recetas</h2>
      <button mat-stroked-button (click)="verCatalogo()">
        <mat-icon>share</mat-icon> Catálogo
      </button>
    </div>

    @if (store.recetas().length === 0) {
      <div class="text-center py-8 text-gray-400">
        <mat-icon style="font-size: 48px; width: 48px; height: 48px">menu_book</mat-icon>
        <p>No hay recetas cargadas aún</p>
        <p class="text-sm">Tocá el botón + para crear la primera</p>
      </div>
    }

    @for (receta of store.recetas(); track receta.id) {
      <mat-card class="touch-card mb-3" (click)="auth.isOwner() ? editar(receta) : null">
        <mat-card-content class="py-2">
          <div class="flex items-center justify-between mb-1">
            <div class="font-medium text-base">{{ receta.nombre }}</div>
            <div class="flex items-center gap-1">
              <mat-chip-set>
                <mat-chip class="text-xs">{{ receta.categoria }}</mat-chip>
              </mat-chip-set>
              @if (auth.isOwner()) {
                <button mat-icon-button [matMenuTriggerFor]="recetaMenu"
                        (click)="$event.stopPropagation()">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #recetaMenu="matMenu">
                  <button mat-menu-item (click)="duplicar(receta)">
                    <mat-icon>content_copy</mat-icon> Duplicar
                  </button>
                </mat-menu>
              }
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2 text-center mt-2">
            <div>
              <div class="text-xs text-gray-500">Costo</div>
              <div class="font-semibold text-red-600">{{ receta.costoCalculado | ars }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500">Margen</div>
              <div class="font-semibold">{{ receta.margenGanancia }}%</div>
            </div>
            <div>
              <div class="text-xs text-gray-500">Precio</div>
              <div class="font-semibold text-green-600">{{ receta.precioVenta | ars }}</div>
            </div>
          </div>

          <div class="text-xs text-gray-400 mt-1">
            {{ receta.ingredientes.length }} ingredientes · rinde {{ receta.rendimiento }} u.
          </div>
        </mat-card-content>
      </mat-card>
    }

    @if (auth.isOwner()) {
      <button mat-fab class="fab-bottom-right" color="primary" (click)="crear()">
        <mat-icon>add</mat-icon>
      </button>
    }
  `,
})
export class RecetasComponent {
  readonly store = inject(PasteleriaStore);
  readonly auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  crear() {
    const dialogRef = this.dialog.open(RecetaFormComponent, {
      width: '100%',
      maxWidth: '560px',
      maxHeight: '90vh',
      data: null,
    });

    dialogRef.afterClosed().subscribe(async (result: Receta | undefined) => {
      if (result) {
        await this.store.crearReceta(result);
        this.snackBar.open('Receta creada', 'OK', { duration: 2000 });
      }
    });
  }

  editar(receta: Receta) {
    const dialogRef = this.dialog.open(RecetaFormComponent, {
      width: '100%',
      maxWidth: '560px',
      maxHeight: '90vh',
      data: receta,
    });

    dialogRef.afterClosed().subscribe(async (result: Receta | 'delete' | undefined) => {
      if (result === 'delete') {
        await this.store.eliminarReceta(receta.id!);
        this.snackBar.open('Receta eliminada', 'OK', { duration: 2000 });
      } else if (result) {
        await this.store.actualizarReceta(receta.id!, result);
        this.snackBar.open('Receta actualizada', 'OK', { duration: 2000 });
      }
    });
  }

  async duplicar(receta: Receta) {
    await this.store.duplicarReceta(receta);
    this.snackBar.open('Receta duplicada', 'OK', { duration: 2000 });
  }

  verCatalogo() {
    this.dialog.open(CatalogoDialogComponent, {
      width: '100%',
      maxWidth: '600px',
      maxHeight: '90vh',
    });
  }
}
