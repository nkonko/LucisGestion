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
import { Venta, VentaItem, MedioPago, MEDIOS_PAGO_DISPLAY } from '../../core/models/venta.model';
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
  template: `
    <h2 mat-dialog-title>Nueva Venta</h2>

    <mat-dialog-content class="flex flex-col gap-3">
      <!-- Product selection as cards -->
      <h3 class="text-sm font-medium">Seleccionar productos</h3>
      <div class="grid grid-cols-2 gap-2">
        @for (receta of recetasStore.recetas(); track receta.id) {
          <mat-card
            class="touch-card text-center py-2 cursor-pointer"
            [class.selected-card]="getItemCantidad(receta.id!) > 0"
            (click)="agregarItem(receta)"
          >
            <div class="font-medium text-sm">{{ receta.nombre }}</div>
            <div class="text-sm font-bold">{{ receta.precioVenta | ars }}</div>
            @if (getItemCantidad(receta.id!) > 0) {
              <div class="flex items-center justify-center gap-2 mt-1">
                <button
                  mat-icon-button
                  (click)="decrementarItem(receta.id!); $event.stopPropagation()"
                >
                  <mat-icon style="font-size: 18px">remove</mat-icon>
                </button>
                <span class="font-bold">{{ getItemCantidad(receta.id!) }}</span>
                <button mat-icon-button (click)="agregarItem(receta); $event.stopPropagation()">
                  <mat-icon style="font-size: 18px">add</mat-icon>
                </button>
              </div>
            }
          </mat-card>
        }
      </div>

      <!-- Client -->
      <mat-form-field appearance="outline">
        <mat-label>Cliente (opcional)</mat-label>
        <input
          matInput
          [(ngModel)]="busquedaCliente"
          [matAutocomplete]="autoCliente"
          placeholder="Buscar cliente..."
        />
        <mat-autocomplete
          #autoCliente="matAutocomplete"
          (optionSelected)="seleccionarCliente($event.option.value)"
          [displayWith]="displayCliente"
        >
          @for (c of clientesFiltrados(); track c.id) {
            <mat-option [value]="c">{{ c.nombre }} — {{ c.telefono }}</mat-option>
          }
        </mat-autocomplete>
      </mat-form-field>

      <!-- Payment -->
      <mat-form-field appearance="outline">
        <mat-label>Medio de pago</mat-label>
        <mat-select [(ngModel)]="medioPago">
          @for (mp of mediosPago; track mp.key) {
            <mat-option [value]="mp.key">{{ mp.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Notas</mat-label>
        <input matInput [(ngModel)]="notas" placeholder="Observaciones del pedido" />
      </mat-form-field>

      <!-- Total -->
      <div class="text-center py-2 bg-green-50 rounded-lg">
        <div class="text-sm text-gray-500">Total</div>
        <div class="text-3xl font-bold text-green-700">{{ total() | ars }}</div>
        <div class="text-xs text-gray-400">Ganancia estimada: {{ ganancia() | ars }}</div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        (click)="confirmar()"
        [disabled]="items().length === 0"
      >
        Confirmar venta
      </button>
    </mat-dialog-actions>
  `,
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

    const venta: Omit<Venta, 'id'> = {
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
