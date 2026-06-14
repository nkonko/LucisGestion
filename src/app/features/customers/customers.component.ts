import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';
import { CustomersStore } from '../../core/store/customers.store';
import { WhatsAppService } from '../../core/services/whatsapp.service';
import { Customer, CustomerInput } from '../../core/models/customer';
import { CustomerFormComponent } from './create customer/customer-form.component';
import { BottomSheetService } from '../../core/services/bottom-sheet.service';
import { UiCardComponent, UiIconComponent } from '../../shared/ui/components';

@Component({
  selector: 'app-customers',
  imports: [UiCardComponent, UiIconComponent],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomersComponent {
  readonly store = inject(CustomersStore);
  private whatsApp = inject(WhatsAppService);
  private dialog = inject(BottomSheetService);
  private notify = inject(NotificationService);

  searchTerm = signal('');

  filteredCustomers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const items = this.store.customers().filter((c) => c.name !== '[eliminado]');
    if (!term) return items;
    return items.filter(
      (c) => c.name.toLowerCase().includes(term) || c.phone.toLowerCase().includes(term),
    );
  });

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim();
    this.searchTerm.set(value);
  }

  create(): void {
    const dialogRef = this.dialog.open<null, CustomerInput>(CustomerFormComponent, {
      title: 'Nuevo cliente',
      section: 'Cliente',
      maxWidth: '500px',
      data: null,
    });

    dialogRef.afterClosed.subscribe(async (result) => {
      if (result) {
        try {
          await this.store.createCustomer(result);
          this.notify.success('Cliente creado');
        } catch (error: unknown) {
          this.notify.errorFrom(error, 'No se pudo crear el cliente');
        }
      }
    });
  }

  edit(customer: Customer): void {
    const dialogRef = this.dialog.open<Customer, CustomerInput | 'delete'>(CustomerFormComponent, {
      title: 'Editar cliente',
      section: 'Cliente',
      maxWidth: '500px',
      data: customer,
    });

    dialogRef.afterClosed.subscribe(async (result) => {
      try {
        if (result === 'delete') {
          await this.store.deleteCustomer(customer.id);
          this.notify.success('Cliente eliminado');
        } else if (result) {
          await this.store.updateCustomer(customer.id, result);
          this.notify.success('Cliente actualizado');
        }
      } catch (error: unknown) {
        this.notify.errorFrom(error, 'No se pudo guardar el cliente');
      }
    });
  }

  openWhatsApp(customer: Customer, event: Event): void {
    event.stopPropagation();
    this.whatsApp.sendMessage(
      customer.phone,
      `Hola ${customer.name}! 🧁 Te escribo de Lucis Pastelería.`,
    );
  }
}
