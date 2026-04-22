import { Component, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NotificationService } from '../../core/services/notification.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CustomersStore } from '../../core/store/customers.store';
import { WhatsAppService } from '../../core/services/whatsapp.service';
import { Customer } from '../../core/models/customer';
import { CustomerFormComponent } from './customer-form.component';

@Component({
  selector: 'app-customers',
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.scss',
})
export class CustomersComponent {
  readonly store = inject(CustomersStore);
  private whatsApp = inject(WhatsAppService);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);

  searchTerm = signal('');

  filteredCustomers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const items = this.store.customers();
    if (!term) return items;
    return items.filter(
      (c) => c.name.toLowerCase().includes(term) || c.phone.toLowerCase().includes(term),
    );
  });

  create() {
    const dialogRef = this.dialog.open(CustomerFormComponent, {
      width: '100%',
      maxWidth: '500px',
      data: null,
    });

    dialogRef.afterClosed().subscribe(async (result: Customer | undefined) => {
      if (result) {
        try {
          await this.store.createCustomer(result);
          this.notify.success('Cliente creado');
        } catch (error) {
          this.notify.errorFrom(error, 'No se pudo crear el cliente');
        }
      }
    });
  }

  edit(customer: Customer) {
    const dialogRef = this.dialog.open(CustomerFormComponent, {
      width: '100%',
      maxWidth: '500px',
      data: customer,
    });

    dialogRef.afterClosed().subscribe(async (result: Customer | 'delete' | undefined) => {
      try {
        if (result === 'delete') {
          await this.store.deleteCustomer(customer.id!);
          this.notify.success('Cliente eliminado');
        } else if (result) {
          await this.store.updateCustomer(customer.id!, result);
          this.notify.success('Cliente actualizado');
        }
      } catch (error) {
        this.notify.errorFrom(error, 'No se pudo guardar el cliente');
      }
    });
  }

  openWhatsApp(customer: Customer, event: Event) {
    event.stopPropagation();
    this.whatsApp.sendMessage(
      customer.phone,
      `Hola ${customer.name}! 🧁 Te escribo de Lucis Pastelería.`,
    );
  }
}
