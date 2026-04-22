import { ChangeDetectionStrategy, Component, inject, computed, signal } from '@angular/core';
import { NgTemplateOutlet, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NotificationService } from '../../core/services/notification.service';
import { VentasStore } from '../../core/store/ventas.store';
import { ClientesStore } from '../../core/store/clientes.store';
import { WhatsAppService } from '../../core/services/whatsapp.service';
import { ESTADOS_VENTA_CLASS } from '../../core/models/venta/estado-venta.model';
import type { EstadoVenta } from '../../core/models/venta/estado-venta.model';
import { Venta, ESTADOS_VENTA_DISPLAY } from '../../core/models/venta';
import { ArsPipe } from '../../shared/pipes/ars.pipe';
import { VentaFormComponent } from './venta-form.component';

@Component({
  selector: 'app-ventas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    DatePipe,
    MatButtonModule,
    MatTabsModule,
    MatDialogModule,
    ArsPipe,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './ventas.component.html',
  styleUrl: './ventas.component.scss',
})
export class VentasComponent {
  readonly store = inject(VentasStore);
  private clientesStore = inject(ClientesStore);
  private whatsApp = inject(WhatsAppService);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);

  estadosDisplay: Record<EstadoVenta, string> = ESTADOS_VENTA_DISPLAY;

  pendientes = this.store.pedidosPendientes;

  searchTerm = signal('');
  fechaDesde = signal<Date | null>(null);

  historialFiltrado = computed(() => {
    let items = this.store.ventas();
    const term = this.searchTerm().toLowerCase().trim();
    const desde = this.fechaDesde();

    if (term) {
      items = items.filter(
        (v) =>
          v.clienteNombre.toLowerCase().includes(term) ||
          v.items.some((i) => i.nombre.toLowerCase().includes(term)),
      );
    }
    if (desde) {
      items = items.filter((v) => v.fecha?.toDate() >= desde);
    }
    return items;
  });

  getEstadoClass(estado: EstadoVenta): string {
    return ESTADOS_VENTA_CLASS[estado];
  }

  getEstadoLabel(estado: EstadoVenta): string {
    return ESTADOS_VENTA_DISPLAY[estado];
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
        this.notify.success('Venta registrada. Stock actualizado.', 3000);
      }
    });
  }

  async cambiarEstado(venta: Venta, nuevoEstado: Venta['estado']) {
    await this.store.actualizarEstadoVenta(venta.id!, nuevoEstado);
    this.notify.success(`Pedido marcado como ${nuevoEstado}`);
  }

  enviarWhatsApp(venta: Venta) {
    const cliente = this.clientesStore.clientes().find((c) => c.id === venta.clienteId);
    const items = venta.items.map((i) => `${i.cantidad}x ${i.nombre}`).join('\n');
    const msg = `Hola ${venta.clienteNombre}! 🧁\n\nTu pedido de Lucis Pastelería:\n${items}\n\nTotal: $${venta.total}\n\n¡Gracias!`;
    this.whatsApp.enviarMensaje(cliente?.telefono ?? '', msg);
  }
}
