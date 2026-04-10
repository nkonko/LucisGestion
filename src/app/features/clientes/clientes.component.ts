import { Component, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PasteleriaStore } from '../../core/store';
import { Cliente } from '../../core/models';
import { ClienteFormComponent } from './cliente-form.component';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule,
    MatDialogModule, MatSnackBarModule,
    MatFormFieldModule, MatInputModule,
  ],
  template: `
    <h2 class="text-xl font-semibold mb-4">Clientes</h2>

    <mat-form-field class="w-full mb-2" appearance="outline">
      <mat-icon matPrefix>search</mat-icon>
      <mat-label>Buscar cliente</mat-label>
      <input matInput (input)="searchTerm.set($any($event.target).value)" [value]="searchTerm()">
    </mat-form-field>

    @if (clientesFiltrados().length === 0) {
      <div class="text-center py-8 text-gray-400">
        <mat-icon style="font-size: 48px; width: 48px; height: 48px">people</mat-icon>
        @if (searchTerm()) {
          <p>No se encontraron clientes</p>
        } @else {
          <p>No hay clientes cargados aún</p>
          <p class="text-sm">Tocá el botón + para agregar el primero</p>
        }
      </div>
    }

    @for (cliente of clientesFiltrados(); track cliente.id) {
      <mat-card class="touch-card mb-3" (click)="editar(cliente)">
        <mat-card-content class="flex items-center justify-between py-2">
          <div>
            <div class="font-medium">{{ cliente.nombre }}</div>
            @if (cliente.telefono) {
              <div class="text-sm text-gray-500">
                <mat-icon class="icon-sm">phone</mat-icon> {{ cliente.telefono }}
              </div>
            }
            @if (cliente.direccion) {
              <div class="text-sm text-gray-500">
                <mat-icon class="icon-sm">place</mat-icon> {{ cliente.direccion }}
              </div>
            }
          </div>
          <div class="text-right flex flex-col items-end gap-1">
            <div class="text-sm text-gray-400">{{ cliente.totalCompras }} compras</div>
            @if (cliente.telefono) {
              <button mat-icon-button color="primary" (click)="abrirWhatsApp(cliente, $event)"
                      aria-label="Enviar WhatsApp">
                <mat-icon>chat</mat-icon>
              </button>
            }
          </div>
        </mat-card-content>
      </mat-card>
    }

    <button mat-fab class="fab-bottom-right" color="primary" (click)="crear()">
      <mat-icon>add</mat-icon>
    </button>
  `,
  styles: [`
    .icon-sm {
      font-size: 14px;
      width: 14px;
      height: 14px;
      vertical-align: middle;
      margin-right: 4px;
    }
  `],
})
export class ClientesComponent {
  readonly store = inject(PasteleriaStore);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  searchTerm = signal('');

  clientesFiltrados = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const items = this.store.clientes();
    if (!term) return items;
    return items.filter(c =>
      c.nombre.toLowerCase().includes(term) ||
      c.telefono.toLowerCase().includes(term)
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
        this.snackBar.open('Cliente creado', 'OK', { duration: 2000 });
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
        await this.store.actualizarCliente(cliente.id!, { nombre: '[eliminado]' } as any);
        this.snackBar.open('Cliente eliminado', 'OK', { duration: 2000 });
      } else if (result) {
        await this.store.actualizarCliente(cliente.id!, result);
        this.snackBar.open('Cliente actualizado', 'OK', { duration: 2000 });
      }
    });
  }

  abrirWhatsApp(cliente: Cliente, event: Event) {
    event.stopPropagation();
    const tel = this.normalizarTelefono(cliente.telefono);
    const msg = encodeURIComponent(`Hola ${cliente.nombre}! 🧁 Te escribo de Lucis Pastelería.`);
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
