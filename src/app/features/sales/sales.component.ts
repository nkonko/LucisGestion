import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';
import { SalesStore } from '../../core/store/sales.store';
import { CustomersStore } from '../../core/store/customers.store';
import { WhatsAppService } from '../../core/services/whatsapp.service';
import type { SaleStatus } from '../../core/models/sale/sale-status.model';
import { Sale, SALE_STATUS_DISPLAY } from '../../core/models/sale';
import { SaleFormComponent } from './create-sale/sale-form.component';
import { DialogService } from '../../core/services/dialog.service';
import { UiIconComponent } from '../../shared/ui/components';
import { SalesCardComponent } from './sales-card/sales-card.component';

@Component({
  selector: 'app-sales',
  imports: [UiIconComponent, SalesCardComponent],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesComponent {
  readonly store = inject(SalesStore);
  private customersStore = inject(CustomersStore);
  private whatsApp = inject(WhatsAppService);
  private dialog = inject(DialogService);
  private notify = inject(NotificationService);

  readonly selectedTab = signal<'pending' | 'history'>('pending');
  statusDisplay: Record<SaleStatus, string> = SALE_STATUS_DISPLAY;
  pending = this.store.pendingOrders;

  searchTerm = signal('');
  dateFrom = signal<Date | null>(null);
  selectedCustomerId = signal<string | null>(null);
  selectedStatus = signal<SaleStatus | null>(null);

  readonly customers = computed(() => this.customersStore.customers());

  filteredHistory = computed(() => {
    let items = this.store.sales();
    const term = this.searchTerm().toLowerCase().trim();
    const from = this.dateFrom();
    const customerId = this.selectedCustomerId();
    const status = this.selectedStatus();

    if (term) {
      items = items.filter(
        (v) =>
          v.customerName.toLowerCase().includes(term) ||
          v.items.some((i) => i.name.toLowerCase().includes(term)),
      );
    }
    if (from) {
      items = items.filter((v) => v.date?.toDate() >= from);
    }
    if (customerId) {
      items = items.filter((v) => v.customerId === customerId);
    }
    if (status) {
      items = items.filter((v) => v.status === status);
    }
    return items;
  });

  onSearchInput(event: Event): void {
    const htmlTarget = event.target as HTMLInputElement | null;
    this.searchTerm.set(htmlTarget?.value ?? '');
  }

  onDateFromInput(event: Event): void {
    const htmlTarget = event.target as HTMLInputElement | null;
    const value = htmlTarget?.value ?? '';
    this.dateFrom.set(value ? new Date(`${value}T00:00:00`) : null);
  }

  onCustomerFilterChange(event: Event): void {
    const htmlTarget = event.target as HTMLSelectElement | null;
    const value = htmlTarget?.value ?? '';
    this.selectedCustomerId.set(value ? value : null);
  }

  onStatusFilterChange(event: Event): void {
    const htmlTarget = event.target as HTMLSelectElement | null;
    const value = htmlTarget?.value as SaleStatus | '';
    this.selectedStatus.set(value ? (value as SaleStatus) : null);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.dateFrom.set(null);
    this.selectedCustomerId.set(null);
    this.selectedStatus.set(null);
  }

  newSale(): void {
    const dialogRef = this.dialog.open<null, Sale>(SaleFormComponent, {
      maxWidth: '560px',
      maxHeight: '90vh',
      data: null,
    });

    dialogRef.afterClosed.subscribe(async (result) => {
      if (result) {
        await this.store.registerSale(result);
        this.notify.success('Venta registrada. Stock actualizado.', 3000);
      }
    });
  }

  async changeStatus(sale: Sale, newStatus: Sale['status']): Promise<void> {
    await this.store.updateSaleStatus(sale.id!, newStatus);
    this.notify.success(`Pedido marcado como ${SALE_STATUS_DISPLAY[newStatus].toLowerCase()}`);
  }

  sendWhatsApp(sale: Sale): void {
    const customer = this.customersStore.customers().find((c) => c.id === sale.customerId);
    const items = sale.items.map((i) => `${i.quantity}x ${i.name}`).join('\n');
    const msg = `Hola ${sale.customerName}! 🧁\n\nTu pedido de Lucis Pastelería:\n${items}\n\nTotal: $${sale.total}\n\n¡Gracias!`;
    this.whatsApp.sendMessage(customer?.phone ?? '', msg);
  }

  onStatusChange(event: { sale: Sale; status: SaleStatus }): void {
    void this.changeStatus(event.sale, event.status);
  }
}
