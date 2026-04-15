import { Component, inject, signal, computed } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormsModule } from '@angular/forms';
import { RecetasStore } from '../../core/store/recetas.store';
import { ClientesStore } from '../../core/store/clientes.store';
import {
  Venta,
  VentaItem,
  MedioPago,
  MEDIOS_PAGO_DISPLAY,
  VentaInput,
} from '../../core/models/venta';
import { Timestamp } from '@angular/fire/firestore';
import { ArsPipe } from '../../shared/pipes/ars.pipe';

@Component({
  selector: 'app-venta-form',
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatAutocompleteModule,
    FormsModule,
    ArsPipe,
  ],
  templateUrl: './venta-form.component.html',
  styles: [
    `
      .selected-card {
        outline: 2px solid var(--mat-sys-primary);
        background: var(--mat-sys-primary-container);
      }
    `,
  ],
})
export class VentaFormComponent {
  private dialogRef = inject(MatDialogRef<VentaFormComponent>);
  readonly recetasStore = inject(RecetasStore);
  private clientesStore = inject(ClientesStore);

  items = signal<VentaItem[]>([]);
  busquedaCliente = '';
  clienteSeleccionado: any = null;
  medioPago: MedioPago = 'efectivo';
  notas = '';

  mediosPago = Object.entries(MEDIOS_PAGO_DISPLAY).map(([key, label]) => ({ key, label }));

  clientesFiltrados = computed(() => {
    const term = this.busquedaCliente?.toLowerCase() ?? '';
    return this.clientesStore
      .clientes()
      .filter((c) => c.nombre.toLowerCase().includes(term) || c.telefono.includes(term));
  });

  total = computed(() => this.items().reduce((sum, i) => sum + i.cantidad * i.precioUnitario, 0));
  costoTotal = computed(() =>
    this.items().reduce((sum, i) => sum + i.cantidad * i.costoUnitario, 0),
  );
  ganancia = computed(() => this.total() - this.costoTotal());

  getItemCantidad(recetaId: string): number {
    return this.items().find((i) => i.recetaId === recetaId)?.cantidad ?? 0;
  }

  agregarItem(receta: any) {
    this.items.update((items) => {
      const existing = items.find((i) => i.recetaId === receta.id);
      if (existing) {
        return items.map((i) =>
          i.recetaId === receta.id ? { ...i, cantidad: i.cantidad + 1 } : i,
        );
      }
      return [
        ...items,
        {
          recetaId: receta.id!,
          nombre: receta.nombre,
          cantidad: 1,
          precioUnitario: receta.precioVenta,
          costoUnitario: receta.costoCalculado,
        },
      ];
    });
  }

  decrementarItem(recetaId: string) {
    this.items.update((items) => {
      const item = items.find((i) => i.recetaId === recetaId);
      if (!item) return items;
      if (item.cantidad <= 1) return items.filter((i) => i.recetaId !== recetaId);
      return items.map((i) => (i.recetaId === recetaId ? { ...i, cantidad: i.cantidad - 1 } : i));
    });
  }

  seleccionarCliente(cliente: any) {
    this.clienteSeleccionado = cliente;
    this.busquedaCliente = cliente.nombre;
  }

  displayCliente(c: any): string {
    return c?.nombre ?? '';
  }

  confirmar() {
    if (this.items().length === 0) return;

    const venta: VentaInput = {
      fecha: Timestamp.now(),
      clienteId: this.clienteSeleccionado?.id ?? null,
      clienteNombre: this.clienteSeleccionado?.nombre ?? this.busquedaCliente ?? '',
      items: this.items(),
      total: this.total(),
      costoTotal: this.costoTotal(),
      ganancia: this.ganancia(),
      medioPago: this.medioPago,
      estado: 'pendiente',
      notas: this.notas,
    };

    this.dialogRef.close(venta);
  }
}
