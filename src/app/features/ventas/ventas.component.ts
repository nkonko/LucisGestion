import { Component, inject, computed, signal } from '@angular/core';
import { NgTemplateOutlet, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PasteleriaStore } from '../../core/store';
import { Venta, ESTADOS_VENTA_DISPLAY } from '../../core/models';
import { ArsPipe } from '../../shared/pipes/ars.pipe';
import { VentaFormComponent } from './venta-form.component';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [
    NgTemplateOutlet, DatePipe,
    MatCardModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatTabsModule, MatDialogModule, MatSnackBarModule, ArsPipe,
    MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule,
  ],
  template: `
    <h2 class="text-xl font-semibold mb-4">Ventas</h2>

    <mat-tab-group>
      <mat-tab label="Pendientes ({{ pendientes().length }})">
        @if (pendientes().length === 0) {
          <div class="text-center py-8 text-gray-400">
            <mat-icon style="font-size: 48px; width: 48px; height: 48px">check_circle</mat-icon>
            <p>No hay pedidos pendientes</p>
          </div>
        }
        @for (venta of pendientes(); track venta.id) {
          <ng-container *ngTemplateOutlet="ventaCard; context: { $implicit: venta }"></ng-container>
        }
      </mat-tab>

      <mat-tab label="Historial">
        <!-- Search & Filters -->
        <div class="flex gap-2 mt-3 mb-2 flex-wrap">
          <mat-form-field appearance="outline" class="flex-1 min-w-[180px]">
            <mat-icon matPrefix>search</mat-icon>
            <mat-label>Buscar cliente / producto</mat-label>
            <input matInput (input)="searchTerm.set($any($event.target).value)" [value]="searchTerm()">
          </mat-form-field>
          <mat-form-field appearance="outline" class="w-[140px]">
            <mat-label>Desde</mat-label>
            <input matInput [matDatepicker]="pickerDesde" (dateChange)="fechaDesde.set($event.value)">
            <mat-datepicker-toggle matSuffix [for]="pickerDesde"></mat-datepicker-toggle>
            <mat-datepicker #pickerDesde></mat-datepicker>
          </mat-form-field>
        </div>

        @if (historialFiltrado().length === 0) {
          <div class="text-center py-6 text-gray-400">
            <p>No se encontraron ventas</p>
          </div>
        }

        @for (venta of historialFiltrado(); track venta.id) {
          <ng-container *ngTemplateOutlet="ventaCard; context: { $implicit: venta }"></ng-container>
        }
      </mat-tab>
    </mat-tab-group>

    <ng-template #ventaCard let-venta>
      <mat-card class="touch-card mb-3 mt-3">
        <mat-card-content class="py-2">
          <div class="flex items-center justify-between mb-1">
            <div>
              <div class="font-medium">{{ venta.clienteNombre || 'Sin cliente' }}</div>
              <div class="text-xs text-gray-400">
                {{ venta.fecha?.toDate() | date:'dd/MM HH:mm' }}
              </div>
            </div>
            <div class="text-right">
              <div class="text-lg font-bold">{{ venta.total | ars }}</div>
              <mat-chip-set>
                <mat-chip [class]="getEstadoClass(venta.estado)" style="font-size: 11px">
                  {{ estadosDisplay[venta.estado] }}
                </mat-chip>
              </mat-chip-set>
            </div>
          </div>

          <div class="text-xs text-gray-500">
            @for (item of venta.items; track item.recetaId) {
              {{ item.cantidad }}x {{ item.nombre }}{{ !$last ? ' · ' : '' }}
            }
          </div>

          @if (venta.estado === 'pendiente') {
            <div class="flex justify-end gap-2 mt-2">
              @if (venta.clienteNombre) {
                <button mat-icon-button color="primary" (click)="enviarWhatsApp(venta)"
                        aria-label="Enviar por WhatsApp">
                  <mat-icon>chat</mat-icon>
                </button>
              }
              <button mat-stroked-button color="warn" (click)="cambiarEstado(venta, 'cancelado')">
                Cancelar
              </button>
              <button mat-flat-button color="primary" (click)="cambiarEstado(venta, 'entregado')">
                Entregar ✓
              </button>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </ng-template>

    <button mat-fab class="fab-bottom-right" color="primary" (click)="nuevaVenta()">
      <mat-icon>add</mat-icon>
    </button>
  `,
})
export class VentasComponent {
  readonly store = inject(PasteleriaStore);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  estadosDisplay: Record<string, string> = ESTADOS_VENTA_DISPLAY;

  pendientes = this.store.pedidosPendientes;

  searchTerm = signal('');
  fechaDesde = signal<Date | null>(null);

  historialFiltrado = computed(() => {
    let items = this.store.ventas();
    const term = this.searchTerm().toLowerCase().trim();
    const desde = this.fechaDesde();

    if (term) {
      items = items.filter(v =>
        v.clienteNombre.toLowerCase().includes(term) ||
        v.items.some(i => i.nombre.toLowerCase().includes(term))
      );
    }
    if (desde) {
      items = items.filter(v => v.fecha?.toDate() >= desde);
    }
    return items;
  });

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'pendiente': return 'stock-warning';
      case 'entregado': return 'stock-ok';
      case 'cancelado': return 'stock-danger';
      default: return '';
    }
  }

  nuevaVenta() {
    const dialogRef = this.dialog.open(VentaFormComponent, {
      width: '100%',
      maxWidth: '560px',
      maxHeight: '90vh',
      data: null,
    });

    dialogRef.afterClosed().subscribe(async (result: Venta | undefined) => {
      if (result) {
        await this.store.registrarVenta(result);
        this.snackBar.open('Venta registrada. Stock actualizado.', 'OK', { duration: 3000 });
      }
    });
  }

  async cambiarEstado(venta: Venta, nuevoEstado: Venta['estado']) {
    await this.store.actualizarEstadoVenta(venta.id!, nuevoEstado);
    this.snackBar.open(`Pedido marcado como ${nuevoEstado}`, 'OK', { duration: 2000 });
  }

  enviarWhatsApp(venta: Venta) {
    const cliente = this.store.clientes().find(c => c.id === venta.clienteId);
    const tel = this.normalizarTelefono(cliente?.telefono ?? '');
    const items = venta.items.map(i => `${i.cantidad}x ${i.nombre}`).join('\n');
    const msg = encodeURIComponent(
      `Hola ${venta.clienteNombre}! 🧁\n\nTu pedido de Lucis Pastelería:\n${items}\n\nTotal: $${venta.total}\n\n¡Gracias!`
    );
    window.open(`https://wa.me/${tel}?text=${msg}`, '_blank');
  }

  private normalizarTelefono(tel: string): string {
    let digits = tel.replace(/\D/g, '');
    // Si tiene 10 dígitos (celular argentino sin código país), agregar 549
    if (digits.length === 10) digits = '549' + digits;
    // Si tiene 11 dígitos y empieza con 15, quitar 15 y agregar 549 + código de área
    else if (digits.length === 11 && digits.startsWith('15')) digits = '549' + digits.slice(2);
    return digits;
  }
}
