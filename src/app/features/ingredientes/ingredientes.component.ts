import { Component, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NotificationService } from '../../core/services/notification.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { IngredientesStore } from '../../core/store/ingredientes.store';
import { RecetasStore } from '../../core/store/recetas.store';
import { Ingrediente } from '../../core/models/ingrediente.model';
import { ArsPipe } from '../../shared/pipes/ars.pipe';
import { IngredienteFormComponent } from './ingrediente-form.component';
import { HistorialPreciosComponent } from './historial-precios.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-ingredientes',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    ArsPipe,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 class="text-xl font-semibold mb-4">Ingredientes</h2>

    <mat-form-field class="w-full mb-2" appearance="outline">
      <mat-icon matPrefix>search</mat-icon>
      <mat-label>Buscar ingrediente</mat-label>
      <input matInput (input)="searchTerm.set($any($event.target).value)" [value]="searchTerm()" />
    </mat-form-field>

    @if (ingredientesFiltrados().length === 0) {
      <div class="text-center py-8 text-gray-400">
        <mat-icon style="font-size: 48px; width: 48px; height: 48px">egg</mat-icon>
        @if (searchTerm()) {
          <p>No se encontraron ingredientes</p>
        } @else {
          <p>No hay ingredientes cargados aún</p>
          <p class="text-sm">Tocá el botón + para agregar el primero</p>
        }
      </div>
    }

    @for (ingrediente of ingredientesFiltrados(); track ingrediente.id) {
      <mat-card class="touch-card mb-3" (click)="auth.isOwner() ? editar(ingrediente) : null">
        <mat-card-content class="flex items-center justify-between py-2">
          <div>
            <div class="font-medium">{{ ingrediente.nombre }}</div>
            <div class="text-sm text-gray-500">
              {{ ingrediente.precioUnitario | ars }} / {{ ingrediente.unidad }}
            </div>
          </div>
          <div class="text-right flex items-center gap-1">
            <div>
              <div [class]="getStockClass(ingrediente)" class="font-bold">
                {{ ingrediente.stockActual }} {{ ingrediente.unidad }}
              </div>
              <div class="text-xs text-gray-400">mín: {{ ingrediente.stockMinimo }}</div>
            </div>
            <button
              mat-icon-button
              (click)="verHistorial(ingrediente, $event)"
              aria-label="Historial de precios"
              class="text-gray-400"
            >
              <mat-icon style="font-size: 18px">history</mat-icon>
            </button>
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
export class IngredientesComponent {
  readonly store = inject(IngredientesStore);
  private recetasStore = inject(RecetasStore);
  readonly auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);

  searchTerm = signal('');

  ingredientesFiltrados = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const items = this.store.ingredientes();
    if (!term) return items;
    return items.filter((i) => i.nombre.toLowerCase().includes(term));
  });

  getStockClass(i: Ingrediente): string {
    if (i.stockActual <= 0) return 'stock-danger';
    if (i.stockActual <= i.stockMinimo) return 'stock-warning';
    return 'stock-ok';
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
        const precioChanged = result.precioUnitario !== ingrediente.precioUnitario;
        await this.store.actualizarIngrediente(ingrediente.id!, result);
        if (precioChanged) {
          await this.recetasStore.recalcularPorCambioIngrediente(ingrediente.id!);
          this.notify.success('Ingrediente actualizado. Recetas recalculadas.', 3000);
        } else {
          this.notify.success('Ingrediente actualizado');
        }
      }
    });
  }

  verHistorial(ingrediente: Ingrediente, event: Event) {
    event.stopPropagation();
    this.dialog.open(HistorialPreciosComponent, {
      width: '100%',
      maxWidth: '450px',
      data: { id: ingrediente.id, nombre: ingrediente.nombre },
    });
  }
}
