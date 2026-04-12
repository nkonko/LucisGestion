import { Component, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NotificationService } from '../../core/services/notification.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ClientesStore } from '../../core/store/clientes.store';
import { WhatsAppService } from '../../core/services/whatsapp.service';
import { Cliente, ClienteInput } from '../../core/models/cliente.model';
import { ClienteFormComponent } from './cliente-form.component';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './clientes.component.html',
  styles: [
    `
      .icon-sm {
        font-size: 14px;
        width: 14px;
        height: 14px;
        vertical-align: middle;
        margin-right: 4px;
      }
    `,
  ],
})
export class ClientesComponent {
  readonly store = inject(ClientesStore);
  private whatsApp = inject(WhatsAppService);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);

  searchTerm = signal('');

  clientesFiltrados = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const items = this.store.clientes();
    if (!term) return items;
    return items.filter(
      (c) => c.nombre.toLowerCase().includes(term) || c.telefono.toLowerCase().includes(term),
    );
  });

  crear() {
    const dialogRef = this.dialog.open(ClienteFormComponent, {
      width: '100%',
      maxWidth: '500px',
      data: null,
    });

    dialogRef.afterClosed().subscribe(async (result: Cliente | undefined) => {
      if (result) {
        await this.store.crearCliente(result);
        this.notify.success('Cliente creado');
      }
    });
  }

  editar(cliente: Cliente) {
    const dialogRef = this.dialog.open(ClienteFormComponent, {
      width: '100%',
      maxWidth: '500px',
      data: cliente,
    });

    dialogRef.afterClosed().subscribe(async (result: Cliente | 'delete' | undefined) => {
      if (result === 'delete') {
        await this.store.actualizarCliente(cliente.id!, { nombre: '[eliminado]' } as ClienteInput);
        this.notify.success('Cliente eliminado');
      } else if (result) {
        await this.store.actualizarCliente(cliente.id!, result);
        this.notify.success('Cliente actualizado');
      }
    });
  }

  abrirWhatsApp(cliente: Cliente, event: Event) {
    event.stopPropagation();
    this.whatsApp.enviarMensaje(
      cliente.telefono,
      `Hola ${cliente.nombre}! 🧁 Te escribo de Lucis Pastelería.`,
    );
  }
}
