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
  templateUrl: './ingredientes.component.html',
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
